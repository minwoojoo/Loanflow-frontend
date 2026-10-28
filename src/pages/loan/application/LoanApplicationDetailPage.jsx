import { useEffect, useState } from "react";
import { apiFetch } from "../../../api/apiFetch";
import "./LoanApplicationDetailPage.css";

export default function LoanApplicationDetailPage({
                                                      accessToken,
                                                    auth,
                                                    setAuth,
                                                      applicationId,
                                                      onBack,
                                                    onResume,
                                                  }) {
    const [application, setApplication] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    // 신청서 삭제 처리
    const [deleting, setDeleting] = useState(false);
    const [deleteError, setDeleteError] = useState("");


    // =====================================
    // 1. 대출 신청 상세 조회
    // =====================================
    useEffect(() => {
        if (!accessToken || applicationId == null) {
            setApplication(null);
            setError("신청서 정보를 확인할 수 없습니다.");
            setLoading(false);
            return;
        }

        const controller = new AbortController();

        async function fetchApplicationDetail() {
            setLoading(true);
            setError("");
            setApplication(null);

            try {

                const response = await apiFetch(
                    `/api/loan-applications/${applicationId}`,
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
                            "로그인이 만료되었습니다. 다시 로그인해주세요."
                        );
                    }

                    if (response.status === 404) {
                        throw new Error(
                            "조회할 수 있는 대출 신청서가 없습니다."
                        );
                    }

                    throw new Error(
                        "대출 신청 상세 조회에 실패했습니다."
                    );
                }

                const data = await response.json();

                if (!controller.signal.aborted) {
                    setApplication(data);
                }

            } catch (err) {
                if (!controller.signal.aborted && err.name !== "AbortError") {
                    setError(
                        err.message || "신청서 조회 중 오류가 발생했습니다."
                    );
                }
            } finally {
                if (!controller.signal.aborted) {
                    setLoading(false);
                }
            }
        }

        fetchApplicationDetail();

        return () => {
            controller.abort();
        };

    }, [applicationId, accessToken]);

    // =====================================
    // 2. 금액 표시
    // =====================================
    function formatMoney(amount) {
        if (amount === null || amount === undefined) {
            return "미입력";
        }

        return `${Number(amount).toLocaleString("ko-KR")}원`;
    }

    // =====================================
    // 3. 날짜 및 시간 표시
    // =====================================
    function formatDateTime(value) {
        if (!value) {
            return "기록 없음";
        }

        // 예: 2026-10-20T14:30:00
        const [date, time] = value.split("T");

        if (!date) {
            return "기록 없음";
        }

        const formattedDate = date.replace(/-/g, ".");
        const formattedTime = time ? time.slice(0, 5) : "";

        return `${formattedDate} ${formattedTime}`.trim();
    }

    // =====================================
    // 4. 직업 유형 표시
    // =====================================
    function formatEmploymentType(type) {
        const employmentTypes = {
            EMPLOYED: "직장인",
            SELF_EMPLOYED: "자영업자",
            FREELANCER: "프리랜서",
            UNEMPLOYED: "무직",
        };

        return employmentTypes[type] || type || "미입력";
    }

    // =====================================
    // 5. 일반 값 표시
    // =====================================
    function formatValue(value, unit = "") {
        if (value === null || value === undefined) {
            return "미입력";
        }

        return `${value}${unit}`;
    }

    // =====================================
    // 6. 신청 상태별 CSS 클래스
    // =====================================
    function getStatusClass(status) {
        switch (status) {
            case "승인":
                return "approved";
            case "거절":
                return "rejected";
            case "심사중":
                return "reviewing";
            case "작성중":
                return "draft";
            default:
                return "draft";
        }
    }

    // =====================================
    // 7. 진행 이력 데이터 구성
    // =====================================
    function getProgressHistory(data) {
        const history = [];

        if (data.createdAt) {
            history.push({
                label: "신청서 작성 시작",
                date: data.createdAt,
            });
        }

        if (data.appliedAt) {
            history.push({
                label: "대출 신청 제출 완료",
                date: data.appliedAt,
            });
        }

        if (data.reviewedAt) {
            let resultLabel = "대출 심사 완료";

            if (data.statusName === "승인") {
                resultLabel = "대출 심사 승인";
            } else if (data.statusName === "거절") {
                resultLabel = "대출 심사 거절";
            }

            history.push({
                label: resultLabel,
                date: data.reviewedAt,
            });
        }

        return history;
    }

    // =====================================
    // 8. 작성중 대출 신청서 삭제
    // =====================================
    const handleDeleteApplication = async () => {

        // 작성중 상태에서만 삭제 허용
        if (
            !application ||
            application.statusName !== "작성중" ||
            deleting
        ) {
            return;
        }

        const confirmed = window.confirm(
            "작성 중인 대출 신청서를 삭제하시겠습니까?\n" +
            "삭제한 신청서는 신청 내역에서 더 이상 조회할 수 없습니다."
        );

        if (!confirmed) {
            return;
        }

        setDeleting(true);
        setDeleteError("");

        try {

            const response = await apiFetch(
                `/api/loan-applications/${applicationId}`,
                {
                    method: "DELETE",
                },
                auth,
                setAuth
            );


            if (!response.ok) {
                if (response.status === 401) {
                    throw new Error(
                        "로그인이 만료되었습니다. 다시 로그인해주세요."
                    );
                }

                if (response.status === 403) {
                    throw new Error(
                        "접근 권한이 없습니다."
                    );
                }

                if (response.status === 404) {
                    throw new Error(
                        "삭제 가능한 대출 신청서가 없습니다."
                    );
                }

                throw new Error(
                    "대출 신청서 삭제에 실패했습니다."
                );
            }

            // 204 No Content: 응답 본문 없음
            window.alert("대출 신청서가 삭제되었습니다.");

            // 신청 목록 화면으로 이동
            onBack();

        } catch (err) {
            setDeleteError(
                err.message || "신청서 삭제 중 오류가 발생했습니다."
            );
        } finally {
            setDeleting(false);
        }
    };


    // =====================================
    // 9. 화면
    // =====================================
    return (
        <main className="loan-detail-page">
            <div className="loan-detail-container">

                {/* 상단 헤더 */}
                <div className="loan-detail-header">
                    <button
                        type="button"
                        className="loan-detail-back-button"
                        onClick={onBack}
                    >
                        ← 신청 목록으로
                    </button>

                    <h1>대출 신청 상세 정보</h1>
                    <p>
                        대출 신청 정보와 진행 상태를 확인할 수 있습니다.
                    </p>
                </div>

                {/* 로딩 */}
                {loading && (
                    <div
                        className="loan-detail-message"
                        role="status"
                    >
                        신청 상세 정보를 불러오는 중입니다...
                    </div>
                )}

                {/* 오류 */}
                {!loading && error && (
                    <div
                        className="loan-detail-message loan-detail-error"
                        role="alert"
                    >
                        {error}
                    </div>
                )}

                {/* 신청 상세 정보 */}
                {!loading && !error && application && (
                    <>
                        {/* 1. 신청 상태 */}
                        <section className="loan-detail-card">

                            <div className="loan-detail-summary">
                                <div>
                                    <span className="loan-detail-application-id">
                                        신청서 ID: {application.applicationId}
                                    </span>

                                    <h2>{application.productName}</h2>
                                </div>

                                <span
                                    className={`loan-detail-status ${getStatusClass(
                                        application.statusName
                                    )}`}
                                >
                                    {application.statusName}
                                </span>
                            </div>

                        </section>

                        {/* 2. 대출 신청 정보 */}
                        <section className="loan-detail-card">
                            <h2 className="loan-detail-section-title">
                                대출 신청 정보
                            </h2>

                            <div className="loan-detail-info-grid">

                                <div className="loan-detail-info-item">
                                    <span>신청 금액</span>
                                    <strong>
                                        {formatMoney(
                                            application.applicationAmount
                                        )}
                                    </strong>
                                </div>

                                <div className="loan-detail-info-item">
                                    <span>대출 기간</span>
                                    <strong>
                                        {formatValue(
                                            application.loanTerm,
                                            "개월"
                                        )}
                                    </strong>
                                </div>

                                <div className="loan-detail-info-item">
                                    <span>예상 대출 한도</span>
                                    <strong>
                                        {formatMoney(
                                            application.availableLimit
                                        )}
                                    </strong>
                                </div>

                                <div className="loan-detail-info-item">
                                    <span>예상 연 금리</span>
                                    <strong>
                                        {formatValue(
                                            application.estimatedInterestRate,
                                            "%"
                                        )}
                                    </strong>
                                </div>

                            </div>
                        </section>

                        {/* 3. 신청자 정보 */}
                        <section className="loan-detail-card">
                            <h2 className="loan-detail-section-title">
                                신청자 정보
                            </h2>

                            <div className="loan-detail-info-grid">

                                <div className="loan-detail-info-item">
                                    <span>직업 유형</span>
                                    <strong>
                                        {formatEmploymentType(
                                            application.employmentType
                                        )}
                                    </strong>
                                </div>

                                <div className="loan-detail-info-item">
                                    <span>연 소득</span>
                                    <strong>
                                        {formatMoney(
                                            application.annualIncome
                                        )}
                                    </strong>
                                </div>

                                <div className="loan-detail-info-item">
                                    <span>생년월일</span>
                                    <strong>
                                        {application.birthDate || "미입력"}
                                    </strong>
                                </div>

                            </div>
                        </section>

                        {/* 4. 진행 이력 */}
                        <section className="loan-detail-card">
                            <h2 className="loan-detail-section-title">
                                진행 이력
                            </h2>

                            <div className="loan-detail-timeline">
                                {getProgressHistory(application).map(
                                    (item, index) => (
                                        <div
                                            className="loan-detail-timeline-item"
                                            key={index}
                                        >
                                            <div className="loan-detail-timeline-marker">
                                                <span className="loan-detail-timeline-dot" />
                                            </div>

                                            <div className="loan-detail-timeline-content">
                                                <strong>{item.label}</strong>

                                                <p>
                                                    {formatDateTime(item.date)}
                                                </p>
                                            </div>
                                        </div>
                                    )
                                )}
                            </div>

                            {/* 현재 상태 안내 */}
                            {application.statusName === "작성중" && (
                                <div className="loan-detail-progress-message">
                                    아직 최종 제출되지 않은 신청서입니다.
                                </div>
                            )}

                            {application.statusName === "심사중" && (
                                <div className="loan-detail-progress-message">
                                    현재 대출 심사가 진행 중입니다.
                                </div>
                            )}
                        </section>

                        {/* 작성중 신청서 수정 및 삭제 */}
                        {application.statusName === "작성중" && (
                            <>
                                {deleteError && (
                                    <p className="loan-detail-delete-error" role="alert">
                                        {deleteError}
                                    </p>
                                )}

                                <div className="loan-detail-action-area">

                                    {/* 신청서 삭제 */}
                                    <button
                                        type="button"
                                        className="loan-detail-delete-button"
                                        onClick={handleDeleteApplication}
                                        disabled={deleting}
                                    >
                                        {deleting
                                            ? "삭제 중..."
                                            : "신청서 삭제"}
                                    </button>

                                    {/* 이어서 신청하기 */}
                                    <button
                                        type="button"
                                        className="loan-detail-resume-button"
                                        onClick={() => {
                                            onResume(application);
                                        }}
                                        disabled={deleting}
                                    >
                                        이어서 신청하기 →
                                    </button>

                                </div>
                            </>
                        )}
                    </>
                )}

            </div>
        </main>
    );
}
