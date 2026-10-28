import { useEffect, useState } from "react";
import { apiFetch } from "../../../api/apiFetch";

export default function AdminProcessingLogsPage({
                                                    accessToken,
                                                    auth,
                                                    setAuth,
                                                    onSelect,
                                                }) {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    // =====================================
    // 심사 처리 이력 목록 조회
    // =====================================
    useEffect(() => {
        const controller = new AbortController();

        async function fetchLogs() {
            setLoading(true);
            setError("");

            try {
                const response = await apiFetch(
                    "/api/admin/processing-logs",
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

                    throw new Error(
                        "처리 이력을 불러오지 못했습니다."
                    );
                }

                const data = await response.json();

                // 요청이 취소되지 않았을 때만 상태 갱신
                if (!controller.signal.aborted) {
                    setLogs(data);
                }

            } catch (err) {
                // 화면 이동 등으로 취소된 요청은 무시
                if (
                    !controller.signal.aborted &&
                    err.name !== "AbortError"
                ) {
                    setError(
                        err.message ||
                        "처리 이력 조회 중 오류가 발생했습니다."
                    );
                }

            } finally {
                if (!controller.signal.aborted) {
                    setLoading(false);
                }
            }
        }

        fetchLogs();

        return () => controller.abort();

    }, [accessToken]);

    // 날짜 표시
    const formatDate = (date) => {
        if (!date) return "-";
        return date.replace("T", " ").substring(0, 19);
    };

    // 처리 상태에 따른 CSS 클래스
    const getStatusClass = (status) => {
        switch (status) {
            case "SUCCESS":
                return "approved";
            case "FAILED":
                return "rejected";
            case "DUPLICATE":
                return "reviewing";
            default:
                return "draft";
        }
    };

    return (
        <section>
            <div className="admin-page-heading">
                <h2>심사 처리 이력 조회</h2>
                <p>
                    전체 대출 심사 요청 및 콜백 처리 내역을 조회합니다.
                </p>
            </div>

            {loading && (
                <p>처리 이력을 불러오는 중입니다.</p>
            )}

            {!loading && error && (
                <p className="admin-error">{error}</p>
            )}

            {!loading && !error && (
                <div className="admin-panel">
                    <div className="admin-list-header">
                        <h3>처리 이력 목록</h3>
                        <span>총 {logs.length}건</span>
                    </div>

                    {logs.length === 0 ? (
                        <p className="admin-empty">
                            등록된 처리 이력이 없습니다.
                        </p>
                    ) : (
                        <div className="admin-table-wrapper">
                            <table className="admin-table">
                                <thead>
                                <tr>
                                    <th>로그 ID</th>
                                    <th>신청서 ID</th>
                                    <th>회원명</th>
                                    <th>상품명</th>
                                    <th>처리 유형</th>
                                    <th>처리 상태</th>
                                    <th>처리 일시</th>
                                    <th>상세</th>
                                </tr>
                                </thead>

                                <tbody>
                                {logs.map((log) => (
                                    <tr key={log.logId}>
                                        <td>{log.logId}</td>
                                        <td>{log.applicationId}</td>
                                        <td>{log.memberName ?? "-"}</td>
                                        <td>{log.productName ?? "-"}</td>
                                        <td>{log.processType}</td>

                                        <td>
                                                <span
                                                    className={
                                                        `admin-status ${getStatusClass(
                                                            log.processStatus
                                                        )}`
                                                    }
                                                >
                                                    {log.processStatus}
                                                </span>
                                        </td>

                                        <td>
                                            {formatDate(log.createdAt)}
                                        </td>

                                        <td>
                                            <button
                                                type="button"
                                                className="admin-detail-button"
                                                onClick={() =>
                                                    onSelect(log.logId)
                                                }
                                            >
                                                상세 조회
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}
        </section>
    );
}
