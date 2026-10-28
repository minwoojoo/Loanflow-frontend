let latestAccessToken = null;
let refreshPromise = null;
let authVersion = 0;


// =====================================
// 1. 로그인 성공 시 Access Token 저장
// =====================================
export function setAccessToken(token) {
    authVersion += 1;
    latestAccessToken = token;
}


// =====================================
// 2. 로그아웃 시 Access Token 초기화
// =====================================
export function clearAccessToken() {
    authVersion += 1;
    latestAccessToken = null;
}


// =====================================
// 3. Refresh Token으로 Access Token 재발급
// =====================================
export function refreshAccessToken() {

    // 이미 재발급 요청이 진행 중이라면
    // 동일한 Promise를 반환하여 중복 요청 방지
    if (refreshPromise) {
        return refreshPromise;
    }

    const currentVersion = authVersion;

    const promise = fetch("/api/auth/refresh", {
        method: "POST",
        credentials: "include",
    }).then(async (response) => {

        if (!response.ok) {
            const error = new Error(
                "토큰 재발급에 실패했습니다."
            );

            error.status = response.status;
            throw error;
        }

        const data = await response.json();

        // 재발급 요청 중 로그아웃 또는
        // 다른 계정 로그인이 발생한 경우
        if (currentVersion !== authVersion) {
            throw new Error(
                "인증 상태가 변경되었습니다."
            );
        }

        // 새로운 Access Token 저장
        latestAccessToken = data.accessToken;

        return data;
    });

    refreshPromise = promise;

    // 재발급 요청 종료 시 Promise 초기화
    promise.finally(() => {
        if (refreshPromise === promise) {
            refreshPromise = null;
        }
    }).catch(() => {
        // finally에서 생성된 Promise의 거부 처리
    });

    return promise;
}


// =====================================
// 4. 인증이 필요한 API 공통 요청
// =====================================
export async function apiFetch(
    url,
    options = {},
    auth,
    setAuth
) {

    // 요청을 시작한 시점의 인증 상태 버전
    const currentVersion = authVersion;

    // 가장 최신 Access Token 사용
    const requestToken =
        latestAccessToken || auth?.accessToken;

    if (!requestToken) {
        throw new Error(
            "로그인 정보가 없습니다."
        );
    }

    // ---------------------------------
    // Access Token을 포함한 요청 함수
    // ---------------------------------
    const sendRequest = (token) => {

        const headers = new Headers(
            options.headers || {}
        );

        headers.set(
            "Authorization",
            `Bearer ${token}`
        );

        return fetch(url, {
            ...options,
            headers,
        });
    };


    // =====================================
    // 5. 기존 Access Token으로 API 요청
    // =====================================

    let response = await sendRequest(requestToken);

    // 401이 아니면 정상적으로 응답 반환
    if (response.status !== 401) {
        return response;
    }

    // 이미 요청이 취소된 경우
    if (options.signal?.aborted) {
        throw new DOMException(
            "요청이 취소되었습니다.",
            "AbortError"
        );
    }

    // 요청 도중 로그아웃 또는 계정 변경 발생
    if (currentVersion !== authVersion) {
        throw new Error(
            "인증 상태가 변경되었습니다."
        );
    }


    // =====================================
    // 6. 다른 API가 이미 토큰을 갱신한 경우
    // =====================================

    if (
        latestAccessToken &&
        latestAccessToken !== requestToken
    ) {
        // Refresh 요청 없이 새 토큰으로 재시도
        return sendRequest(latestAccessToken);
    }


    // =====================================
    // 7. Refresh Token으로 재발급
    // =====================================

    let refreshedAuth;

    try {
        refreshedAuth = await refreshAccessToken();

    } catch (error) {

        // 사용자가 이미 로그아웃했다면
        // 현재 인증 상태를 변경하지 않음
        if (currentVersion !== authVersion) {
            throw error;
        }

        // Refresh Token이 만료되거나 무효한 경우
        // 인증 오류일 때만 로그아웃 처리
        if (
            error.status === 401 ||
            error.status === 403
        ) {
            clearAccessToken();
            setAuth(null);

            throw new Error(
                "로그인이 만료되었습니다. 다시 로그인해주세요."
            );
        }

        // 네트워크 오류 등은 자동 로그아웃하지 않음
        throw new Error(
            "토큰 재발급 중 오류가 발생했습니다. 다시 시도해주세요."
        );
    }


    // =====================================
    // 8. 재발급 성공 후 인증 상태 갱신
    // =====================================

    if (currentVersion !== authVersion) {
        throw new Error(
            "인증 상태가 변경되었습니다."
        );
    }

    // 이전 요청이 취소되었으면 재요청하지 않음
    if (options.signal?.aborted) {
        throw new DOMException(
            "요청이 취소되었습니다.",
            "AbortError"
        );
    }

    // React 로그인 상태 갱신
    setAuth(refreshedAuth);


    // =====================================
    // 9. 새로운 Access Token으로 API 재요청
    // =====================================

    // 이 요청은 try/catch 밖에서 실행하므로
    // AbortError 또는 네트워크 오류가 발생해도
    // 로그아웃되지 않음
    return sendRequest(refreshedAuth.accessToken);
}
