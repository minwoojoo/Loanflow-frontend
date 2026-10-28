import { useEffect, useState } from "react";
import { apiFetch } from "../../../api/apiFetch";

export default function AdminProcessingLogDetailPage({
                                                         accessToken,
                                                         auth,
                                                         setAuth,
                                                         logId,
                                                         onBack,
                                                     }) {
    const [log, setLog] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    // =====================================
    // 심사 처리 이력 상세 조회
    // =====================================
    useEffect(() => {
        const controller = new AbortController();

        async function fetchLogDetail() {
            setLoading(true);
            setError("");
            setLog(null);

            try {
                const response = await apiFetch(
                    `/api/admin/processing-logs/${logId}`,
                    {
                        method: "GET",
                        signal: controller.signal,
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
                            "처리 이력을 찾을 수 없습니다."
                        );
                    }

                    throw new Error(
                        "처리 이력 상세 조회에 실패했습니다."
                    );
                }

                const data = await response.json();

                // 요청이 취소되지 않았을 때만 상태 갱신
                if (!controller.signal.aborted) {
                    setLog(data);
                }

            } catch (err) {
                // 화면 이동 등으로 취소된 요청은 무시
                if (
                    !controller.signal.aborted &&
                    err.name !== "AbortError"
                ) {
                    setError(
                        err.message ||
                        "처리 이력 상세 조회 중 오류가 발생했습니다."
                    );
                }

            } finally {
                if (!controller.signal.aborted) {
                    setLoading(false);
                }
            }
        }

        fetchLogDetail();

        return () => controller.abort();

    }, [accessToken, logId]);

    // 일반 값 표시
    const formatValue = (value) =>
        value == null || value === "" ? "-" : value;

    // 날짜 표시
    const formatDate = (date) =>
        date ? date.replace("T", " ").substring(0, 19) : "-";

    return (
        <section>
            {/* 목록으로 돌아가기 */}
            <button
                type="button"
                className="admin-back-button"
                onClick={onBack}
            >
                ← 목록으로 돌아가기
            </button>

            <div className="admin-page-heading">
                <h2>심사 처리 이력 상세 조회</h2>
                <p>선택한 처리 이력의 상세 정보를 확인합니다.</p>
            </div>

            {loading && (
                <p>상세 정보를 불러오는 중입니다.</p>
            )}

            {!loading && error && (
                <p className="admin-error">{error}</p>
            )}

            {!loading && !error && log && (
                <div className="admin-detail-sections">

                    {/* 기본 정보 */}
                    <div className="admin-panel">
                        <h3>기본 정보</h3>

                        <div className="admin-detail-grid">
                            <div>
                                <span>로그 ID</span>
                                <strong>{formatValue(log.logId)}</strong>
                            </div>

                            <div>
                                <span>신청서 ID</span>
                                <strong>{formatValue(log.applicationId)}</strong>
                            </div>

                            <div>
                                <span>회원 ID</span>
                                <strong>{formatValue(log.memberId)}</strong>
                            </div>

                            <div>
                                <span>회원명</span>
                                <strong>{formatValue(log.memberName)}</strong>
                            </div>

                            <div>
                                <span>상품 ID</span>
                                <strong>{formatValue(log.productId)}</strong>
                            </div>

                            <div>
                                <span>상품명</span>
                                <strong>{formatValue(log.productName)}</strong>
                            </div>
                        </div>
                    </div>

                    {/* 심사 처리 정보 */}
                    <div className="admin-panel">
                        <h3>심사 처리 정보</h3>

                        <div className="admin-detail-grid">
                            <div>
                                <span>심사 요청 ID</span>
                                <strong>{formatValue(log.requestId)}</strong>
                            </div>

                            <div>
                                <span>처리 유형</span>
                                <strong>{formatValue(log.processType)}</strong>
                            </div>

                            <div>
                                <span>처리 상태</span>
                                <strong>{formatValue(log.processStatus)}</strong>
                            </div>

                            <div>
                                <span>처리 일시</span>
                                <strong>{formatDate(log.createdAt)}</strong>
                            </div>
                        </div>
                    </div>

                    {/* 오류 정보 */}
                    <div className="admin-panel">
                        <h3>오류 정보</h3>

                        <div className="admin-detail-grid">
                            <div>
                                <span>오류 코드</span>
                                <strong>{formatValue(log.errorCode)}</strong>
                            </div>

                            <div>
                                <span>오류 메시지</span>
                                <strong>{formatValue(log.errorMessage)}</strong>
                            </div>
                        </div>
                    </div>

                </div>
            )}
        </section>
    );
}
