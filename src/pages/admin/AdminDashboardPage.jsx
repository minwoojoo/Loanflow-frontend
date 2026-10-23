import { useEffect, useState } from "react";


export default function AdminDashboardPage({accessToken}) {

    const [summary, setSummary] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const controller = new AbortController();

        async function fetchSummary() {
            setLoading(true);
            setError("");

            try{
                const response = await fetch(
                    "/api/admin/dashboard/summary",
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
                        throw new Error("로그인이 만료되었습니다.");
                    }

                    if (response.status === 403) {
                        throw new Error("운영자 권한이 없습니다.");
                    }

                    throw new Error("대시보드 통계를 불러오지 못했습니다.");
                }

                const data = await response.json();
                setSummary(data);

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

        fetchSummary();

        return() => controller.abort();

    }, [accessToken]);

    const summaryCards = summary ? [
        { label: "전체 신청", value: summary.totalCount },
        { label: "작성중", value: summary.draftCount },
        { label: "심사중", value: summary.reviewingCount },
        { label: "승인", value: summary.approvedCount },
        { label: "거절", value: summary.rejectedCount }
    ] : [];


    return (
        <section>
            <div className="admin-page-heading">
                <h2>운영 대시보드</h2>
                <p>대출 신청 및 심사 현황을 확인합니다.</p>
            </div>

            {loading && (
                <p>통계 데이터를 불러오는 중입니다.</p>
            )}

            {!loading && error && (
                <p className="admin-error">{error}</p>
            )}

            {!loading && !error && summary && (
                <>
                    <div className="admin-dashboard-grid">
                        {summaryCards.map((card) => (
                            <div
                                className="admin-summary-card"
                                key={card.label}
                            >
                                <div className="admin-summary-label">
                                    {card.label}
                                </div>

                                <div className="admin-summary-value">
                                    {Number(card.value ?? 0).toLocaleString()}
                                    <span> 건</span>
                                </div>
                            </div>
                        ))}
                    </div>



                    {/* 추후 구현 예정 기능 */}
                    <div className="admin-dashboard-panels">

                        <div className="admin-panel admin-dashboard-upcoming">
                            <h3>일별 대출 신청 추이</h3>
                            <p>최근 7일간의 대출 신청 현황을 확인할 수 있습니다.</p>

                            <div className="admin-upcoming-message">
                                추후 구현 예정입니다.
                            </div>
                        </div>

                        <div className="admin-panel admin-dashboard-upcoming">
                            <h3>대출 신청 퍼널 분석</h3>
                            <p>신청서 생성부터 심사 완료까지의 진행 현황을 확인할 수 있습니다.</p>

                            <div className="admin-upcoming-message">
                                추후 구현 예정입니다.
                            </div>
                        </div>

                    </div>

                </>
            )}
        </section>
    );
}
