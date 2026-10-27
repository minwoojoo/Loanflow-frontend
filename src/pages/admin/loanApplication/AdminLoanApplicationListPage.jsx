import { useEffect, useState } from "react";

import "./AdminLoanApplicationListPage.css";

export default function AdminLoanApplicationListPage({accessToken, onSelect}) {
    // 대출 신청 목록
    const [applications, setApplications] = useState([]);

    // API 요청 상태
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    // 전체 대출 신청 목록 조회
    useEffect(() => {
        const controller = new AbortController();

        async function fetchApplications() {
            setLoading(true);
            setError("");

            try {
                const response = await fetch(
                    "/api/admin/loan-applications",
                    {
                        method: "GET",
                        headers: {
                            Authorization: `Bearer ${accessToken}`
                        },
                        signal: controller.signal
                    }
                );

                if (!response.ok) {
                    if (response.status === 401) {
                        throw new Error(
                            "로그인이 만료되었습니다. 다시 로그인해주세요."
                        );
                    }

                    if (response.status === 403) {
                        throw new Error(
                            "운영자 권한이 없습니다."
                        );
                    }

                    throw new Error(
                        "대출 신청 목록 조회에 실패했습니다."
                    );
                }

                const data = await response.json();
                setApplications(data);

            } catch (err) {
                if (err.name !== "AbortError") {
                    setError(err.message);
                }

            } finally {
                if (!controller.signal.aborted) {
                    setLoading(false);
                }
            }
        }

        fetchApplications();

        return () => controller.abort();

    }, [accessToken]);

    // 금액 표시
    const formatAmount = (amount) => {
        if (amount == null) return "-";
        return `${Number(amount).toLocaleString()}원`;
    };

    // 날짜 표시
    const formatDate = (date) => {
        if (!date) return "-";

        const parsedDate = new Date(date);

        if (Number.isNaN(parsedDate.getTime())) {
            return date;
        }

        return parsedDate.toLocaleString("ko-KR");
    };

    // 신청 상태에 따른 스타일
    const getStatusClass = (status) => {
        switch (status) {
            case "작성중":
                return "draft";
            case "심사중":
                return "reviewing";
            case "승인":
                return "approved";
            case "거절":
                return "rejected";
            default:
                return "";
        }
    };

    return (
        <section className="admin-application-list">

            <div className="admin-page-heading">
                <h2>전체 대출 신청서 조회</h2>
                <p>전체 회원의 대출 신청 현황을 조회합니다.</p>
            </div>

            {loading && (
                <p>대출 신청 목록을 불러오는 중입니다.</p>
            )}

            {!loading && error && (
                <p className="admin-error">{error}</p>
            )}

            {!loading && !error && (
                <div className="admin-panel">

                    <div className="admin-list-header">
                        <h3>대출 신청 목록</h3>

                        <span>
                            총 {applications.length}건
                        </span>
                    </div>

                    {applications.length === 0 ? (
                        <p className="admin-empty">
                            등록된 대출 신청서가 없습니다.
                        </p>
                    ) : (
                        <div className="admin-table-wrapper">
                            <table className="admin-table">
                                <thead>
                                <tr>
                                    <th>신청 ID</th>
                                    <th>회원명</th>
                                    <th>상품명</th>
                                    <th>신청 금액</th>
                                    <th>신청 상태</th>
                                    <th>신청 일시</th>
                                    <th>상세 조회</th>
                                </tr>
                                </thead>

                                <tbody>
                                {applications.map((app) => (
                                    <tr key={app.applicationId}>
                                        <td>{app.applicationId}</td>
                                        <td>{app.memberName}</td>
                                        <td>{app.productName}</td>

                                        <td>
                                            {formatAmount(
                                                app.applicationAmount
                                            )}
                                        </td>

                                        <td>
                                                <span
                                                    className={
                                                        `admin-status ${getStatusClass(
                                                            app.statusName
                                                        )}`
                                                    }
                                                >
                                                    {app.statusName}
                                                </span>
                                        </td>

                                        <td>
                                            {formatDate(app.appliedAt)}
                                        </td>

                                        <td>
                                            <button
                                                type="button"
                                                className="admin-detail-button"
                                                onClick={() =>
                                                    onSelect(
                                                        app.applicationId
                                                    )
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
