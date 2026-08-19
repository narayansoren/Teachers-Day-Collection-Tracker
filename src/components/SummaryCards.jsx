function SummaryCards({
    totalStudents,
    totalDue,
    totalPaid,
    pendingAmount
}) {
    return (
        <div className="summary-cards">
            <div className="summary-card">
                <p>Total Students</p>
                <h2>{totalStudents}</h2>
            </div>

            <div className="summary-card">
                <p>Total Due</p>
                <h2>₹{totalDue}</h2>
            </div>

            <div className="summary-card">
                <p>Total Paid</p>
                <h2>₹{totalPaid}</h2>
            </div>

            <div className="summary-card">
                <p>Pending Amount</p>
                <h2>₹{pendingAmount}</h2>
            </div>
        </div>
    )
}

export default SummaryCards;