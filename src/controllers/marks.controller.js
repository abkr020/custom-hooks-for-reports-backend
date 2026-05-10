import { neonQuery } from "../db/neonPostgresDB.js";

// import {
//     marksFieldMap,
//     formatMark,
// } from "../../utils/marks.utils.js";





// utils/marks.utils.js

export const marksFieldMap = {

    id: {
        db: "mark_id",
    },

    student_id: {
        db: "student_id",
    },

    "name.first_name": {
        db: "first_name",
    },

    "name.last_name": {
        db: "last_name",
    },

    "classInfo.class": {
        db: "class",
    },

    "classInfo.section": {
        db: "section",
    },

    "marks.physics": {
        db: "physics_marks",
    },

    "marks.chemistry": {
        db: "chemistry_marks",
    },

    "marks.maths": {
        db: "maths_marks",
    },

    exam_type: {
        db: "exam_type",
    },
};

export const formatMark = (mark) => {

    const formatted = {};

    Object.entries(marksFieldMap).forEach(
        ([accessor, config]) => {

            const keys = accessor.split(".");

            let current = formatted;

            // ✅ create nested structure
            for (let i = 0; i < keys.length - 1; i++) {

                if (!current[keys[i]]) {
                    current[keys[i]] = {};
                }

                current = current[keys[i]];
            }

            // ✅ set final value
            current[keys[keys.length - 1]] =
                mark[config.db];
        }
    );

    return formatted;
};

// controllers/reports/marks.controller.js


// ==============================
// GET ALL MARKS
// ==============================
export const getMarks = async (req, res) => {

    try {

        let {
            limit = 10,
            skip = 0,
            search = "",
            sortBy = "id",
            order = "asc",
            class: className,
            section,
            classes = "",
            sections = "",
            exam_type,

        } = req.query;
// convert comma string -> array
classes = classes
    ? classes.split(",")
    : [];

sections = sections
    ? sections.split(",")
    : [];
        limit = Number(limit);
        skip = Number(skip);

        // ✅ frontend accessor -> DB column
        sortBy =
            marksFieldMap[sortBy]?.db ||
            "mark_id";

        // ✅ sanitize order
        order =
            order.toLowerCase() === "desc"
                ? "DESC"
                : "ASC";

        let queryParams = [];
        let conditions = [];

        // ==============================
        // SEARCH
        // ==============================
        if (search.trim()) {

            const searchableColumns = [
                "exam_type",
                "marks.student_id",
                "physics_marks",
                "chemistry_marks",
                "maths_marks",
                "students.first_name",
                "students.last_name",
                "students.class",
                "students.section",
            ];

            const searchConditions =
                searchableColumns.map(
                    (column, index) =>
                        `CAST(${column} AS TEXT) ILIKE $${index + 1}`
                );

            conditions.push(
                `(${searchConditions.join(" OR ")})`
            );

            queryParams.push(
                ...searchableColumns.map(
                    () => `%${search}%`
                )
            );
        }

        // ==============================
        // CLASS FILTER
        // ==============================
        if (className) {

            queryParams.push(className);

            conditions.push(
                `students.class = $${queryParams.length}`
            );
        }

        // ==============================
        // SECTION FILTER
        // ==============================
        if (section) {

            queryParams.push(section);

            conditions.push(
                `students.section = $${queryParams.length}`
            );
        }

        if (classes.length) {

            queryParams.push(classes);

            conditions.push(
                `students.class = ANY($${queryParams.length})`
            );
        }

        if (sections.length) {

            queryParams.push(sections);

            conditions.push(
                `students.section = ANY($${queryParams.length})`
            );
        }
        // ==============================
        // EXAM TYPE FILTER
        // ==============================
        if (exam_type) {

            queryParams.push(exam_type);

            conditions.push(
                `marks.exam_type = $${queryParams.length}`
            );
        }

        // ==============================
        // FINAL WHERE CLAUSE
        // ==============================
        const whereClause =
            conditions.length > 0
                ? `WHERE ${conditions.join(" AND ")}`
                : "";

        // ✅ total count
        const totalQuery = `
            SELECT COUNT(*)
            FROM marks
            LEFT JOIN students
            ON marks.student_id = students.student_id
            ${whereClause}
        `;

        const totalResult = await neonQuery(
            totalQuery,
            queryParams
        );

        const total = Number(
            totalResult.rows[0].count
        );

        // ✅ main query
        let marksQuery = `
            SELECT 
                marks.*,
                students.first_name,
                students.last_name,
                students.class,
                students.section
            FROM marks
            LEFT JOIN students
            ON marks.student_id = students.student_id
            ${whereClause}
            ORDER BY ${sortBy} ${order}
        `;

        // ✅ pagination
        if (limit > 0) {

            const limitIndex =
                queryParams.length + 1;

            const skipIndex =
                queryParams.length + 2;

            marksQuery += `
                LIMIT $${limitIndex}
                OFFSET $${skipIndex}
            `;

            queryParams.push(limit);
            queryParams.push(skip);
        }

        const result = await neonQuery(
            marksQuery,
            queryParams
        );

        // ✅ central formatter
        const formattedMarks =
            result.rows.map(formatMark);

        // await new Promise((res) => setTimeout(res, 4000));
        return res.status(200).json({
            success: true,
            total,
            limit,
            skip,
            marks: formattedMarks,
        });

    } catch (error) {

        console.error(
            "❌ Get Marks Error:",
            error.message
        );

        return res.status(500).json({
            success: false,
            message: "Server Error",
        });
    }
};



// ==============================
// GET MARKS BY STUDENT ID
// ==============================
export const getMarksByStudentId = async (req, res) => {

    try {

        const { studentId } = req.params;

        const result = await neonQuery(
            `
            SELECT *
            FROM marks
            WHERE student_id = $1
            ORDER BY mark_id ASC
            `,
            [studentId]
        );

        if (result.rows.length === 0) {

            return res.status(404).json({
                success: false,
                message: "Marks not found",
            });
        }

        // ✅ central formatter
        const formattedMarks =
            result.rows.map(formatMark);

        return res.status(200).json({
            success: true,
            marks: formattedMarks,
        });

    } catch (error) {

        console.error(
            "❌ Get Marks By Student Error:",
            error.message
        );

        return res.status(500).json({
            success: false,
            message: "Server Error",
        });
    }
};