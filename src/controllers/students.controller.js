import { neonQuery } from "../db/neonPostgresDB.js";


// ==============================
// GET ALL STUDENTS
// ==============================
export const getStudents = async (req, res) => {

    try {

        let {
            limit = 10,
            skip = 0,
            search = "",
            sortBy = "student_id",
            order = "asc",
        } = req.query;

        limit = Number(limit);
        skip = Number(skip);

        // ✅ allowed sortable columns
        const allowedSortColumns = [
            "student_id",
            "first_name",
            "last_name",
            "gender",
            "age",
            "class",
            "section",
            "city",
            "country",
        ];

        // ✅ prevent SQL injection
        if (!allowedSortColumns.includes(sortBy)) {
            sortBy = "student_id";
        }

        order = order.toLowerCase() === "desc" ? "DESC" : "ASC";

        let queryParams = [];
        let whereClause = "";

        // ✅ search filter
        if (search.trim()) {

            whereClause = `
                WHERE
                    first_name ILIKE $1
                    OR last_name ILIKE $1
                    OR city ILIKE $1
                    OR country ILIKE $1
                    OR gender ILIKE $1
            `;

            queryParams.push(`%${search}%`);
        }

        // ✅ total count query
        const totalQuery = `
            SELECT COUNT(*) FROM students
            ${whereClause}
        `;

        const totalResult = await neonQuery(
            totalQuery,
            queryParams
        );

        const total = Number(totalResult.rows[0].count);

        // ✅ pagination
        const limitParamIndex = queryParams.length + 1;
        const skipParamIndex = queryParams.length + 2;

        queryParams.push(limit);
        queryParams.push(skip);

        // ✅ final query
        const studentsQuery = `
            SELECT *
            FROM students
            ${whereClause}
            ORDER BY ${sortBy} ${order}
            LIMIT $${limitParamIndex}
            OFFSET $${skipParamIndex}
        `;

        const result = await neonQuery(
            studentsQuery,
            queryParams
        );

        const formattedStudents = result.rows.map((student) => ({
            id: student.student_id,

            name: {
                first_name: student.first_name,
                last_name: student.last_name,
            },

            gender: student.gender,

            age: student.age,

            classInfo: {
                class: student.class,
                section: student.section,
            },

            address: {
                city: student.city,
                country: student.country,
            },
        }));

        return res.status(200).json({
            success: true,
            total,
            limit,
            skip,
            students: formattedStudents,
        });

    } catch (error) {

        console.error("❌ Get Students Error:", error.message);

        return res.status(500).json({
            success: false,
            message: "Server Error",
        });
    }
};



// ==============================
// GET STUDENT BY ID
// ==============================
export const getStudentById = async (req, res) => {

    try {

        const { id } = req.params;

        const result = await neonQuery(
            `SELECT * FROM students WHERE student_id = $1`,
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Student not found",
            });
        }

        const student = result.rows[0];

        const formattedStudent = {
            id: student.student_id,

            name: {
                first_name: student.first_name,
                last_name: student.last_name,
            },

            gender: student.gender,

            age: student.age,

            classInfo: {
                class: student.class,
                section: student.section,
            },

            address: {
                city: student.city,
                country: student.country,
            },
        };

        return res.status(200).json({
            success: true,
            student: formattedStudent,
        });

    } catch (error) {

        console.error("❌ Get Student By ID Error:", error.message);

        return res.status(500).json({
            success: false,
            message: "Server Error",
        });
    }
};