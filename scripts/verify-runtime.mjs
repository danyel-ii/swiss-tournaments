const baseUrl = process.env.RUNTIME_VERIFY_BASE_URL ?? process.argv[2]

if (!baseUrl) {
  console.error('Usage: npm run verify:runtime -- https://your-deployment-url')
  process.exit(1)
}

const runtimeUrl = new URL(baseUrl)
const username = process.env.RUNTIME_VERIFY_USERNAME ?? null
const password = process.env.RUNTIME_VERIFY_PASSWORD ?? null

function createCookieJar() {
  const cookies = new Map()

  return {
    update(headers) {
      const setCookie = headers.getSetCookie?.() ?? []

      for (const entry of setCookie) {
        const [cookiePair] = entry.split(';', 1)
        const separatorIndex = cookiePair.indexOf('=')

        if (separatorIndex === -1) {
          continue
        }

        const name = cookiePair.slice(0, separatorIndex).trim()
        const value = cookiePair.slice(separatorIndex + 1).trim()

        if (!name) {
          continue
        }

        cookies.set(name, value)
      }
    },
    header() {
      return Array.from(cookies.entries())
        .map(([name, value]) => `${name}=${value}`)
        .join('; ')
    },
  }
}

async function expectJson(pathname, init, expectedStatus) {
  const response = await fetch(new URL(pathname, runtimeUrl), init)

  if (response.status !== expectedStatus) {
    throw new Error(`Expected ${pathname} to return ${expectedStatus}, got ${response.status}`)
  }

  return response.json()
}

async function expectOk(pathname, expectedContentTypeFragment) {
  const response = await fetch(new URL(pathname, runtimeUrl))

  if (!response.ok) {
    throw new Error(`Expected ${pathname} to return 200, got ${response.status}`)
  }

  const contentType = response.headers.get('content-type') ?? ''

  if (!contentType.includes(expectedContentTypeFragment)) {
    throw new Error(
      `Expected ${pathname} content-type to include ${expectedContentTypeFragment}, got ${contentType}`,
    )
  }
}

async function main() {
  const health = await expectJson('/api/health', undefined, 200)

  if (health.status !== 'ok' || health.database !== 'ok') {
    throw new Error(`Health check failed: ${JSON.stringify(health)}`)
  }

  const session = await expectJson('/api/auth/session', undefined, 200)

  if (session.user !== null) {
    throw new Error('Expected anonymous session check to return user=null')
  }

  await expectOk('/manifest.webmanifest', 'application/manifest+json')
  await expectOk('/logo-source.jpeg', 'image/jpeg')

  if (username && password) {
    const cookieJar = createCookieJar()
    const loginResponse = await fetch(new URL('/api/auth/login', runtimeUrl), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Origin: runtimeUrl.origin,
      },
      body: JSON.stringify({ username, password }),
    })

    if (loginResponse.status !== 200) {
      throw new Error(`Expected /api/auth/login to return 200, got ${loginResponse.status}`)
    }

    cookieJar.update(loginResponse.headers)

    const authenticatedSession = await fetch(new URL('/api/auth/session', runtimeUrl), {
      headers: {
        Cookie: cookieJar.header(),
      },
    })

    if (authenticatedSession.status !== 200) {
      throw new Error(
        `Expected authenticated /api/auth/session to return 200, got ${authenticatedSession.status}`,
      )
    }

    const authenticatedSessionPayload = await authenticatedSession.json()

    if (authenticatedSessionPayload.user?.username !== username) {
      throw new Error('Authenticated session verification failed')
    }

    const workspaceResponse = await fetch(new URL('/api/workspace', runtimeUrl), {
      headers: {
        Cookie: cookieJar.header(),
      },
    })

    if (workspaceResponse.status !== 200) {
      throw new Error(`Expected /api/workspace to return 200, got ${workspaceResponse.status}`)
    }

    const logoutResponse = await fetch(new URL('/api/auth/logout', runtimeUrl), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: cookieJar.header(),
        Origin: runtimeUrl.origin,
      },
      body: JSON.stringify({}),
    })

    if (logoutResponse.status !== 200) {
      throw new Error(`Expected /api/auth/logout to return 200, got ${logoutResponse.status}`)
    }
  }

  console.log(`Runtime verification passed for ${runtimeUrl.origin}`)
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error)
  process.exit(1)
})
