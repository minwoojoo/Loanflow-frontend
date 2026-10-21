import logo from "../assets/LoanFlow_logo.jpg";
import "./Header.css";

export default function Header({ onGoHome }) {
    return (
        <header className="common-header">

            {/* 로고 및 홈 이동 버튼 */}
            <button
                type="button"
                className="header-brand"
                onClick={onGoHome}
                aria-label="LoanFlow 홈으로 이동"
            >
                <img src={logo} alt="" />
                <span>LoanFlow</span>
            </button>

            <span className="header-description">
                비대면 대출 서비스
            </span>

        </header>
    );
}
