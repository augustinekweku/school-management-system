export const feeQuery = `SELECT 
    f.id, 
    f.classes,
    f.fee_data, 
    a.school_id,
    a.acad_year,
    t.name AS term_name  
    FROM fee_items f 
    LEFT JOIN academic_years a 
    ON a.id = f.academic_year_id 
    LEFT JOIN terms t 
    ON t.id = f.term_id 
    WHERE f.id = $1 AND f.is_active = true AND 
    f.is_displayable = true
`
export const studentPaymentQuery = `SELECT 
    id,
    amount_paid, 
    balance 
    FROM payment_history WHERE 
    student_id = $1 AND fee_id = $2 
    ORDER BY created_at DESC
`
export const lastPaymentBalance = `SELECT fee_id, balance, transaction_ref FROM payment_history WHERE student_id = $1 ORDER BY created_at DESC LIMIT 1`
export const countPreviouslyPaidFees = `SELECT COUNT(id) AS paid_count FROM payment_history WHERE fee_id = $1 AND student_id = $2`
export const studentQuery = `SELECT 
    id,
    school_id,
    row_id,
    index_no, 
    firstname, 
    current_class 
    FROM students WHERE 
    id = $1
`
export const savePaymentDetailQuery = `INSERT 
    INTO payment_history (id,
        student_id,
        fee_id,
        amount_paid,
        receipt_img,
        receipt_img_id,
        payment_confirmed_by,
        transaction_ref,
        created_at,
        balance) 
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) 
    RETURNING id
`
export const getParentPhoneNumberQuery = `SELECT 
    p.phone 
    FROM parent_student_tb pst 
    INNER JOIN parents p ON p.id = pst.parent_id 
    WHERE pst.student_id = $1
`
export const fetchPaymentQuery = `SELECT 
    s.id AS student_id, 
    s.firstname, 
    s.othername, 
    s.lastname, 
    s.index_no, 
    s.is_new AS is_new_student,
    json_agg(
        json_build_object(
            'payment_id', p.id, 
            'amount_paid', p.amount_paid, 
            'balance', p.balance,
            'receipt_img', p.receipt_img, 
            'transaction_ref', p.transaction_ref, 
            'payment_created_at', p.created_at, 
            'payment_updated_at', p.updated_at,
            'payment_confirmed_by', json_build_object(
                'firstname', pc.firstname, 
                'lastname', pc.lastname, 
                'email', pc.email
            ),
            'payment_updated_by', json_build_object(
                'firstname', pu.firstname, 
                'lastname', pu.lastname, 
                'email', pu.email
            )
        )
    ) AS payments 
FROM 
    students s 
LEFT JOIN 
    payment_history p ON s.id = p.student_id AND p.fee_id = $2 
LEFT JOIN 
    users pc ON pc.id = p.payment_confirmed_by
LEFT JOIN 
    users pu ON pu.id = p.updated_by 
WHERE 
    s.current_class = $1
GROUP BY 
    s.id, s.firstname, s.othername, s.lastname, s.index_no, s.is_new
ORDER BY 
    s.lastname, s.firstname;
`
export const feeRecordQuery = `SELECT 
    id, 
    academic_year_id, 
    term_id, 
    fee_data,
    classes,
    is_active FROM fee_items WHERE id = $1 AND is_displayable = $2
`
