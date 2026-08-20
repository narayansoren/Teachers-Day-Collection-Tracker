function SummaryCards({
    totalStudents,
    totalDue,
    totalPaid,
    pendingAmount
}) {
    return (
        <div className="summary-cards">
            <div className="summary-card">
                <p className="summary-card-label">Total Students</p>
                <h2 className="summary-card-value">{totalStudents}</h2>
            </div>

            <div className="summary-card">
                <p className="summary-card-label">Total Due</p>
                <h2 className="summary-card-value">₹{totalDue}</h2>
            </div>

            <div className="summary-card">
                <p className="summary-card-label">Total Paid</p>
                <h2 className="summary-card-value">₹{totalPaid}</h2>
            </div>

            <div className="summary-card">
                <p className="summary-card-label">Pending Amount</p>
                <h2 className="summary-card-value">₹{pendingAmount}</h2>
            </div>
        </div>
    )
}

export default SummaryCards;