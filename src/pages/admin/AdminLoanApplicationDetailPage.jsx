import { useEffect, useState } from "react";

export default function AdminLoanApplicationDetailPage({
                                                           accessToken,
                                                           applicationId,
                                                           onBack
                                                       }) {
    // 대출 신청 상세 정보
    const [application, setApplication] = useState(null);

    // API 요청 상태
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    // 대출 신청 상세 조회
    useEffect(() => {
        const controller = new AbortController();

        async function fetchApplicationDetail() {
            setLoading(true);
            setError("");
            setApplication(null);

            try {
                const response = await fetch(
                    `/api/admin/loan-applications/${applicationId}`,
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
                        throw new Error("운영자 권한이 없습니다.");
                    }

                    if (response.status === 404) {
                        throw new Error("대출 신청서를 찾을 수 없습니다.");
                    }

                    throw new Error(
                        "대출 신청 상세 조회에 실패했습니다."
                    );
                }

                const data = await response.json();
                setApplication(data);

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

        fetchApplicationDetail();

        return () => controller.abort();

    }, [accessToken, applicationId]);

    // 금액 표시
    const formatAmount = (amount) => {
        if (amount == null) return "-";
        return `${Number(amount).toLocaleString("ko-KR")}원`;
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

    // 일반 값 표시
    const formatValue = (value) => {
        return value == null || value === "" ? "-" : value;
    };

    // 직업 유형 표시
    const formatEmploymentType = (type) => {
        const labels = {
            EMPLOYED: "직장인",
            SELF_EMPLOYED: "자영업자",
            FREELANCER: "프리랜서",
            UNEMPLOYED: "무직"
        };

        return labels[type] || formatValue(type);
    };

    // 신청 상태별 CSS 클래스
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
        <section className="admin-application-detail">

            {/* 목록으로 돌아가기 */}
            <button
                type="button"
                className="admin-back-button"
                onClick={onBack}
            >
                ← 목록으로 돌아가기
            </button>

            <div className="admin-page-heading">
                <h2>대출 신청 상세 조회</h2>
                <p>선택한 대출 신청서의 상세 정보를 확인합니다.</p>
            </div>

            {loading && (
                <p>대출 신청 상세 정보를 불러오는 중입니다.</p>
            )}

            {!loading && error && (
                <p className="admin-error">{error}</p>
            )}

            {!loading && !error && application && (
                <div className="admin-detail-sections">

                    {/* 신청 기본 정보 */}
                    <div className="admin-panel">
                        <h3>신청 기본 정보</h3>

                        <div className="admin-detail-grid">
                            <div>
                                <span>신청서 ID</span>
                                <strong>{application.applicationId}</strong>
                            </div>

                            <div>
                                <span>신청 상태</span>
                                <strong>
                                    <span
                                        className={`admin-status ${getStatusClass(
                                            application.applicationStatus
                                        )}`}
                                    >
                                        {application.applicationStatus}
                                    </span>
                                </strong>
                            </div>

                            <div>
                                <span>신청서 생성일</span>
                                <strong>
                                    {formatDate(application.createdAt)}
                                </strong>
                            </div>

                            <div>
                                <span>최종 신청일</span>
                                <strong>
                                    {formatDate(application.appliedAt)}
                                </strong>
                            </div>
                        </div>
                    </div>

                    {/* 신청 회원 정보 */}
                    <div className="admin-panel">
                        <h3>신청 회원 정보</h3>

                        <div className="admin-detail-grid">
                            <div>
                                <span>회원 ID</span>
                                <strong>{formatValue(application.memberId)}</strong>
                            </div>

                            <div>
                                <span>회원명</span>
                                <strong>{formatValue(application.memberName)}</strong>
                            </div>

                            <div>
                                <span>직업 유형</span>
                                <strong>
                                    {formatEmploymentType(
                                        application.employmentType
                                    )}
                                </strong>
                            </div>

                            <div>
                                <span>연 소득</span>
                                <strong>
                                    {formatAmount(application.annualIncome)}
                                </strong>
                            </div>

                            <div>
                                <span>생년월일</span>
                                <strong>
                                    {formatValue(application.birthDate)}
                                </strong>
                            </div>
                        </div>
                    </div>

                    {/* 대출 조건 */}
                    <div className="admin-panel">
                        <h3>대출 신청 조건</h3>

                        <div className="admin-detail-grid">
                            <div>
                                <span>상품 ID</span>
                                <strong>{formatValue(application.productId)}</strong>
                            </div>

                            <div>
                                <span>상품명</span>
                                <strong>{formatValue(application.productName)}</strong>
                            </div>

                            <div>
                                <span>신청 금액</span>
                                <strong>
                                    {formatAmount(application.applicationAmount)}
                                </strong>
                            </div>

                            <div>
                                <span>대출 기간</span>
                                <strong>
                                    {application.loanTerm == null
                                        ? "-"
                                        : `${application.loanTerm}개월`}
                                </strong>
                            </div>

                            <div>
                                <span>예상 대출 한도</span>
                                <strong>
                                    {formatAmount(application.availableLimit)}
                                </strong>
                            </div>

                            <div>
                                <span>예상 금리</span>
                                <strong>
                                    {application.estimatedInterestRate == null
                                        ? "-"
                                        : `${application.estimatedInterestRate}%`}
                                </strong>
                            </div>

                            <div>
                                <span>상품 최대 대출 기간</span>
                                <strong>
                                    {application.maxLoanTerm == null
                                        ? "-"
                                        : `${application.maxLoanTerm}개월`}
                                </strong>
                            </div>
                        </div>
                    </div>

                    {/* 심사 처리 정보 */}
                    <div className="admin-panel">
                        <h3>심사 처리 정보</h3>

                        <div className="admin-detail-grid">
                            <div>
                                <span>심사 요청 ID</span>
                                <strong>
                                    {formatValue(application.requestId)}
                                </strong>
                            </div>

                            <div>
                                <span>심사 결과 ID</span>
                                <strong>
                                    {formatValue(application.reviewResultId)}
                                </strong>
                            </div>

                            <div>
                                <span>심사 완료일</span>
                                <strong>
                                    {formatDate(application.reviewedAt)}
                                </strong>
                            </div>
                        </div>
                    </div>

                    {/* 삭제 정보 */}
                    <div className="admin-panel">
                        <h3>삭제 정보</h3>

                        <div className="admin-detail-grid">
                            <div>
                                <span>삭제 여부</span>
                                <strong>
                                    {application.isDeleted === "Y"
                                        ? "삭제됨"
                                        : application.isDeleted === "N"
                                            ? "정상"
                                            : "-"}
                                </strong>
                            </div>

                            <div>
                                <span>삭제 일시</span>
                                <strong>
                                    {formatDate(application.deletedAt)}
                                </strong>
                            </div>
                        </div>
                    </div>

                </div>
            )}
        </section>
    );
}
