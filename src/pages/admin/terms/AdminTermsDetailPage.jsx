import { useEffect, useState } from "react";
import { apiFetch } from "../../../api/apiFetch";
import "./AdminTermsDetailPage.css";

export default function AdminTermsDetailPage({
                                                 accessToken,
                                                auth,
                                                setAuth,
                                                 termsId,
                                                 onBack
                                             }) {
    const [terms, setTerms] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [deactivating, setDeactivating] = useState(false);

    // ==========================
    // 1. 약관 상세 조회
    // ==========================
    useEffect(() => {
        const controller = new AbortController();

        async function fetchTermsDetail() {
            setLoading(true);
            setError("");
            setTerms(null);

            try {
                const response = await apiFetch(
                    `/api/admin/terms/${termsId}`,
                    {
                        method: "GET",
                        signal: controller.signal
                    },
                    auth,
                    setAuth
                );

                if (!response.ok) {
                    if (response.status === 401) {
                        throw new Error(
                            "로그인이 만료되었습니다."
                        );
                    }

                    if (response.status === 403) {
                        throw new Error(
                            "운영자 권한이 없습니다."
                        );
                    }

                    if (response.status === 404) {
                        throw new Error(
                            "존재하지 않는 약관입니다."
                        );
                    }

                    throw new Error(
                        "약관 상세 정보를 불러오지 못했습니다."
                    );
                }

                const data = await response.json();

                if (!controller.signal.aborted) {
                    setTerms(data);
                }

            } catch (err) {
                if (
                    err.name !== "AbortError" &&
                    !controller.signal.aborted
                ) {
                    setError(err.message);
                }
            } finally {
                if (!controller.signal.aborted) {
                    setLoading(false);
                }
            }
        }

        fetchTermsDetail();

        return () => controller.abort();

    }, [accessToken, termsId]);

    // ==========================
    // 2. 약관 비활성화
    // ==========================
    const handleDeactivate = async () => {
        if (!terms || terms.isActive !== "Y" || deactivating) {
            return;
        }

        const confirmed = window.confirm(
            "해당 약관을 비활성화하시겠습니까?\n" +
            "비활성화된 약관은 신규 대출 신청 시 " +
            "동의 대상에서 제외됩니다.\n" +
            "기존 약관 동의 이력은 유지됩니다."
        );

        if (!confirmed) {
            return;
        }

        setDeactivating(true);
        setError("");

        try {
            const response = await apiFetch(
                `/api/admin/terms/${termsId}/deactivate`,
                {
                    method: "PATCH",
                },
                auth,
                setAuth
            );

            if (!response.ok) {
                if (response.status === 401) {
                    throw new Error(
                        "로그인이 만료되었습니다."
                    );
                }

                if (response.status === 403) {
                    throw new Error(
                        "운영자 권한이 없습니다."
                    );
                }

                if (response.status === 404) {
                    throw new Error(
                        "존재하지 않는 약관입니다."
                    );
                }

                if (response.status === 409) {
                    throw new Error(
                        "이미 비활성화된 약관입니다."
                    );
                }

                throw new Error(
                    "약관 비활성화에 실패했습니다."
                );
            }

            // 정상 처리 후 약관 목록 화면으로 이동
            onBack();

        } catch (err) {
            setError(err.message);
        } finally {
            setDeactivating(false);
        }
    };

    // ==========================
    // 3. 약관 필수 여부 표시
    // ==========================
    const getRequiredLabel = (requiredYn) => {
        switch (requiredYn) {
            case "Y":
                return "필수";
            case "N":
                return "선택";
            default:
                return "-";
        }
    };

    // ==========================
    // 4. 약관 활성 상태 표시
    // ==========================
    const getActiveLabel = (isActive) => {
        switch (isActive) {
            case "Y":
                return "활성";
            case "N":
                return "비활성";
            default:
                return "-";
        }
    };

    // ==========================
    // 5. 화면 렌더링
    // ==========================
    return (
        <section className="admin-terms-detail-page">

            {/* 목록으로 돌아가기 */}
            <button
                type="button"
                className="admin-back-button admin-terms-back-button"
                onClick={onBack}
            >
                ← 목록으로 돌아가기
            </button>


            {/* 상단 제목 */}
            <div className="admin-page-heading">
                <h2>약관 상세 조회</h2>
                <p>
                    등록된 약관의 상세 정보 및
                    활성 상태를 확인합니다.
                </p>
            </div>


            {/* 로딩 */}
            {loading && (
                <p>약관 상세 정보를 불러오는 중입니다.</p>
            )}

            {/* 오류 */}
            {!loading && error && (
                <p className="admin-error" role="alert">
                    {error}
                </p>
            )}

            {/* 약관 상세 정보 */}
            {!loading && terms && (
                <div className="admin-panel">

                    <div className="admin-terms-detail-header">
                        <h3>{terms.termsName}</h3>

                        <span
                            className={
                                `admin-terms-detail-status ${
                                    terms.isActive === "Y"
                                        ? "active"
                                        : "inactive"
                                }`
                            }
                        >
                            {getActiveLabel(terms.isActive)}
                        </span>
                    </div>

                    {/* 약관 기본 정보 */}
                    <div className="admin-detail-grid">

                        <div className="admin-terms-detail-field">
                            <span>약관 ID</span>
                            <strong>{terms.termsId}</strong>
                        </div>

                        <div className="admin-terms-detail-field">
                            <span>약관 코드</span>
                            <strong>{terms.termsCode}</strong>
                        </div>

                        <div className="admin-terms-detail-field">
                            <span>약관 버전</span>
                            <strong>{terms.termsVersion}</strong>
                        </div>

                        <div className="admin-terms-detail-field">
                            <span>필수 동의 여부</span>
                            <strong>
                                {getRequiredLabel(terms.requiredYn)}
                            </strong>
                        </div>

                    </div>

                    {/* 약관 내용 */}
                    <div className="admin-terms-detail-content-section">
                        <h4>약관 내용</h4>

                        <div className="admin-terms-detail-content">
                            {terms.content || "등록된 약관 내용이 없습니다."}
                        </div>
                    </div>

                    {/* 약관 관리 버튼 */}
                    <div className="admin-terms-detail-actions">
                        {terms.isActive === "Y" && (
                            <button
                                type="button"
                                className="admin-terms-deactivate-button"
                                onClick={handleDeactivate}
                                disabled={deactivating}
                            >
                                {deactivating
                                    ? "비활성화 처리 중..."
                                    : "약관 비활성화"}
                            </button>
                        )}

                        {terms.isActive === "N" && (
                            <p className="admin-terms-detail-notice">
                                이미 비활성화된 약관입니다.
                            </p>
                        )}
                    </div>

                </div>
            )}

        </section>
    );
}
