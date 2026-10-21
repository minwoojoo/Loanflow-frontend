import "./Footer.css";

export default function Footer() {
    return (
        <footer className="common-footer">
            <div className="footer-left">
                <strong>LoanFlow</strong>

                <nav className="footer-links">
                    <button type="button" className="footer-link" disabled>
                        이용약관
                    </button>

                    <button type="button" className="footer-link" disabled>
                        개인정보처리방침
                    </button>
                </nav>

                <p>© 2026 LoanFlow. All rights reserved.</p>
            </div>

            <div className="footer-right">
                <p>고객센터: 02-0000-0000</p>
                <p>이메일: support@example.com</p>
            </div>
        </footer>
    );
}
