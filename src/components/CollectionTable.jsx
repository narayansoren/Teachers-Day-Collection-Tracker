function CollectionTable({ students }) {
    return (
        <div className="table-container">
            <table>
                <thead>
                    <tr>
                        <th>Roll Number</th>
                        <th>Student Name</th>
                        <th>Branch</th>
                        <th>Semester</th>
                        <th>Amount Due</th>
                        <th>Amount Paid</th>
                        <th>Status</th>
                        <th>Payment Mode</th>
                        <th>Date of Payment</th>
                        <th>Collected By</th>
                        <th>Remarks</th>
                    </tr>
                </thead>

                <tbody>
                    {students.map((student) => (
                        <tr key={student["Roll Number"]}>
                            <td>{student["Roll Number"]}</td>
                            <td>{student["Student Name"]}</td>
                            <td>{student["Branch"]}</td>
                            <td>{student["Semester"]}</td>
                            <td>{student["Amount Due"]}</td>
                            <td>{student["Amount Paid"]}</td>
                            <td>{student["Status"]}</td>
                            <td>{student["Payment Mode"]}</td>
                            <td>{student["Date of Payment"]}</td>
                            <td>{student["Collected By"]}</td>
                            <td>{student["Remarks"]}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    )
}

export default CollectionTable