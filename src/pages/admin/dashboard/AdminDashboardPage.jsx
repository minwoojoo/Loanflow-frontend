import { useEffect, useState } from "react";

import "./AdminDashboardPage.css";


export default function AdminDashboardPage({accessToken}) {

    const [summary, setSummary] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [trends, setTrends] = useState([]);
    const [trendsLoading, setTrendsLoading] = useState(true);
    const [trendsError, setTrendsError] = useState("");

    const [funnel, setFunnel] = useState(null);
    const [funnelLoading, setFunnelLoading] = useState(true);
    const [funnelError, setFunnelError] = useState("");

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



    useEffect(() => {
        const controller = new AbortController();

        async function fetchTrends() {
            setTrendsLoading(true);
            setTrendsError("");

            try {
                const response = await fetch(
                    "/api/admin/dashboard/trends",
                    {
                        method: "GET",
                        headers: {
                            Authorization: `Bearer ${accessToken}`
                        },
                        signal: controller.signal
                    }
                );

                if (!response.ok) {
                    throw new Error(
                        "일별 신청 추이를 불러오지 못했습니다."
                    );
                }

                const data = await response.json();

                if (!controller.signal.aborted) {
                    setTrends(data);
                }

            } catch (error) {
                if (!controller.signal.aborted &&
                    error.name !== "AbortError") {
                    setTrendsError(error.message);
                }
            } finally {
                if (!controller.signal.aborted) {
                    setTrendsLoading(false);
                }
            }
        }

        fetchTrends();

        return () => controller.abort();

    }, [accessToken]);

    useEffect(() => {
        const controller = new AbortController();

        const fetchFunnel = async () => {
            setFunnelLoading(true);
            setFunnelError("");

            try {
                const response = await fetch(
                    "/api/admin/dashboard/funnel",
                    {
                        method: "GET",
                        headers: {
                            Authorization: `Bearer ${accessToken}`
                        },
                        signal: controller.signal
                    }
                );

                if (!response.ok) {
                    throw new Error(
                        `퍼널 분석 조회 실패 (${response.status})`
                    );
                }

                const data = await response.json();

                if (!controller.signal.aborted) {
                    setFunnel(data);
                }

            } catch (error) {
                if (!controller.signal.aborted) {
                    setFunnelError(error.message);
                }
            } finally {
                if (!controller.signal.aborted) {
                    setFunnelLoading(false);
                }
            }
        };

        fetchFunnel();

        return() => controller.abort();
    }, [accessToken]);




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



                    <div className="admin-dashboard-panels">

                        <div className="admin-panel admin-dashboard-upcoming">
                            <h3>일별 대출 신청 추이</h3>
                            <p>최근 7일간 최종 제출된 대출 신청 건수입니다.</p>

                            {trendsLoading ? (
                                <p>신청 추이를 불러오는 중입니다.</p>
                            ) : trendsError ? (
                                <p className="admin-error">{trendsError}</p>
                            ) : trends.length === 0 ? (
                                <p>조회 결과가 없습니다.</p>
                            ) : (
                                <div className="admin-trend-chart">
                                    {trends.map((item) => {
                                        const maxCount = Math.max(
                                            1,
                                            ...trends.map(row =>
                                                Number(row.applicationCount)
                                            )
                                        );

                                        const height = (
                                            Number(item.applicationCount) /
                                            maxCount
                                        ) * 100;

                                        return (
                                            <div
                                                className="admin-trend-item"
                                                key={item.applicationDate}
                                            >
                                                <span className="admin-trend-count">
                                                    {item.applicationCount}건
                                                </span>

                                                <div className="admin-trend-bar-area">
                                                    <div
                                                        className="admin-trend-bar"
                                                        style={{
                                                            height: `${height}%`
                                                        }}
                                                    />
                                                </div>

                                                <span className="admin-trend-date">
                                                    {item.applicationDate.slice(5)}
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>



                        {/* 대출 신청 퍼널 분석 */}
                        <div className="admin-panel">
                            <h3>대출 신청 퍼널 분석</h3>
                            <p>최근 7일간 신청서별 단계 전환 현황입니다.</p>

                            {funnelLoading ? (
                                <p>퍼널 데이터를 불러오는 중입니다.</p>
                            ) : funnelError ? (
                                <p className="admin-error">{funnelError}</p>
                            ) : funnel ? (
                                <div className="admin-funnel">
                                    {[
                                        {
                                            label: "신청서 생성",
                                            count: funnel.applicationCreateCount
                                        },
                                        {
                                            label: "한도 조회",
                                            count: funnel.limitCheckCount
                                        },
                                        {
                                            label: "최종 제출",
                                            count: funnel.applicationSubmitCount
                                        }
                                    ].map((step, index, steps) => {

                                        const count = Number(step.count ?? 0);
                                        const firstCount = Number(steps[0].count ?? 0);

                                        // 첫 번째 단계 대비 막대 너비
                                        const width = firstCount > 0
                                            ? (count / firstCount) * 100
                                            : 0;

                                        // 이전 단계 대비 전환율
                                        const previousCount = index === 0
                                            ? count
                                            : Number(steps[index - 1].count ?? 0);

                                        const rate = previousCount > 0
                                            ? (count / previousCount) * 100
                                            : 0;

                                        return (
                                            <div
                                                className="admin-funnel-step"
                                                key={step.label}
                                            >
                                                <div className="admin-funnel-heading">
                                                    <span>{step.label}</span>
                                                    <strong>{count.toLocaleString()}건</strong>
                                                </div>

                                                <div className="admin-funnel-track">
                                                    <div
                                                        className="admin-funnel-fill"
                                                        style={{
                                                            width: `${Math.min(width, 100)}%`
                                                        }}
                                                    />
                                                </div>

                                                <span className="admin-funnel-rate">
                            {index === 0
                                ? "퍼널 시작 단계"
                                : `이전 단계 대비 전환율 ${rate.toFixed(1)}%`
                            }
                        </span>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <p>퍼널 데이터가 없습니다.</p>
                            )}
                        </div>


                    </div>

                </>
            )}
        </section>
    );
}
