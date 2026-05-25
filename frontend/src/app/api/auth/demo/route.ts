import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { createToken } from "@/lib/auth";

const DEMO_EMAIL = "demo@healthtrack.app";
const DEMO_NAME = "Demo User";
const DEMO_PASSWORD = "demo1234";

const DEMO_REPORTS = [
  {
    reportDate: new Date("2024-01-15"),
    labName: "Mani Lab",
    reportType: "Blood Test",
    billId: "ML-2024-001",
    labValues: [
      { testName: "Haemoglobin", testCategory: "CBC", valueNumeric: 11.2, unit: "g/dL", refLow: 12.0, refHigh: 17.0, flag: "L" },
      { testName: "WBC Count", testCategory: "CBC", valueNumeric: 8200, unit: "cells/\u03bcL", refLow: 4000, refHigh: 11000, flag: "N" },
      { testName: "Platelet Count", testCategory: "CBC", valueNumeric: 210000, unit: "cells/\u03bcL", refLow: 150000, refHigh: 400000, flag: "N" },
      { testName: "RBC Count", testCategory: "CBC", valueNumeric: 3.9, unit: "million/\u03bcL", refLow: 4.5, refHigh: 5.9, flag: "L" },
      { testName: "Fasting Blood Sugar", testCategory: "Blood Sugar", valueNumeric: 118, unit: "mg/dL", refLow: 70, refHigh: 100, flag: "H" },
      { testName: "HbA1c", testCategory: "Blood Sugar", valueNumeric: 6.8, unit: "%", refLow: null, refHigh: 5.7, flag: "H" },
      { testName: "Serum Creatinine", testCategory: "Kidney Function", valueNumeric: 1.1, unit: "mg/dL", refLow: 0.6, refHigh: 1.2, flag: "N" },
      { testName: "Blood Urea Nitrogen", testCategory: "Kidney Function", valueNumeric: 22, unit: "mg/dL", refLow: 7, refHigh: 20, flag: "H" },
      { testName: "Total Cholesterol", testCategory: "Lipid Profile", valueNumeric: 218, unit: "mg/dL", refLow: null, refHigh: 200, flag: "H" },
      { testName: "LDL Cholesterol", testCategory: "Lipid Profile", valueNumeric: 142, unit: "mg/dL", refLow: null, refHigh: 100, flag: "H" },
      { testName: "HDL Cholesterol", testCategory: "Lipid Profile", valueNumeric: 38, unit: "mg/dL", refLow: 40, refHigh: null, flag: "L" },
      { testName: "Triglycerides", testCategory: "Lipid Profile", valueNumeric: 192, unit: "mg/dL", refLow: null, refHigh: 150, flag: "H" },
      { testName: "TSH", testCategory: "Thyroid", valueNumeric: 3.2, unit: "\u03bcIU/mL", refLow: 0.4, refHigh: 4.0, flag: "N" },
      { testName: "SGPT (ALT)", testCategory: "Liver Function", valueNumeric: 42, unit: "U/L", refLow: null, refHigh: 40, flag: "H" },
      { testName: "SGOT (AST)", testCategory: "Liver Function", valueNumeric: 35, unit: "U/L", refLow: null, refHigh: 40, flag: "N" },
      { testName: "Sodium", testCategory: "Electrolytes", valueNumeric: 138, unit: "mEq/L", refLow: 135, refHigh: 145, flag: "N" },
      { testName: "Potassium", testCategory: "Electrolytes", valueNumeric: 4.1, unit: "mEq/L", refLow: 3.5, refHigh: 5.0, flag: "N" },
    ],
  },
  {
    reportDate: new Date("2024-06-10"),
    labName: "Mani Lab",
    reportType: "Blood Test",
    billId: "ML-2024-089",
    labValues: [
      { testName: "Haemoglobin", testCategory: "CBC", valueNumeric: 12.8, unit: "g/dL", refLow: 12.0, refHigh: 17.0, flag: "N" },
      { testName: "WBC Count", testCategory: "CBC", valueNumeric: 7400, unit: "cells/\u03bcL", refLow: 4000, refHigh: 11000, flag: "N" },
      { testName: "Platelet Count", testCategory: "CBC", valueNumeric: 228000, unit: "cells/\u03bcL", refLow: 150000, refHigh: 400000, flag: "N" },
      { testName: "RBC Count", testCategory: "CBC", valueNumeric: 4.3, unit: "million/\u03bcL", refLow: 4.5, refHigh: 5.9, flag: "L" },
      { testName: "Fasting Blood Sugar", testCategory: "Blood Sugar", valueNumeric: 108, unit: "mg/dL", refLow: 70, refHigh: 100, flag: "H" },
      { testName: "HbA1c", testCategory: "Blood Sugar", valueNumeric: 6.4, unit: "%", refLow: null, refHigh: 5.7, flag: "H" },
      { testName: "Serum Creatinine", testCategory: "Kidney Function", valueNumeric: 1.0, unit: "mg/dL", refLow: 0.6, refHigh: 1.2, flag: "N" },
      { testName: "Blood Urea Nitrogen", testCategory: "Kidney Function", valueNumeric: 18, unit: "mg/dL", refLow: 7, refHigh: 20, flag: "N" },
      { testName: "Total Cholesterol", testCategory: "Lipid Profile", valueNumeric: 204, unit: "mg/dL", refLow: null, refHigh: 200, flag: "H" },
      { testName: "LDL Cholesterol", testCategory: "Lipid Profile", valueNumeric: 128, unit: "mg/dL", refLow: null, refHigh: 100, flag: "H" },
      { testName: "HDL Cholesterol", testCategory: "Lipid Profile", valueNumeric: 42, unit: "mg/dL", refLow: 40, refHigh: null, flag: "N" },
      { testName: "Triglycerides", testCategory: "Lipid Profile", valueNumeric: 170, unit: "mg/dL", refLow: null, refHigh: 150, flag: "H" },
      { testName: "TSH", testCategory: "Thyroid", valueNumeric: 3.8, unit: "\u03bcIU/mL", refLow: 0.4, refHigh: 4.0, flag: "N" },
      { testName: "SGPT (ALT)", testCategory: "Liver Function", valueNumeric: 36, unit: "U/L", refLow: null, refHigh: 40, flag: "N" },
      { testName: "SGOT (AST)", testCategory: "Liver Function", valueNumeric: 30, unit: "U/L", refLow: null, refHigh: 40, flag: "N" },
      { testName: "Sodium", testCategory: "Electrolytes", valueNumeric: 140, unit: "mEq/L", refLow: 135, refHigh: 145, flag: "N" },
      { testName: "Potassium", testCategory: "Electrolytes", valueNumeric: 4.3, unit: "mEq/L", refLow: 3.5, refHigh: 5.0, flag: "N" },
    ],
  },
  {
    reportDate: new Date("2025-01-20"),
    labName: "Bioline Diagnostics",
    reportType: "Blood Test",
    billId: "BL-2025-012",
    labValues: [
      { testName: "Haemoglobin", testCategory: "CBC", valueNumeric: 13.5, unit: "g/dL", refLow: 12.0, refHigh: 17.0, flag: "N" },
      { testName: "WBC Count", testCategory: "CBC", valueNumeric: 6800, unit: "cells/\u03bcL", refLow: 4000, refHigh: 11000, flag: "N" },
      { testName: "Platelet Count", testCategory: "CBC", valueNumeric: 245000, unit: "cells/\u03bcL", refLow: 150000, refHigh: 400000, flag: "N" },
      { testName: "RBC Count", testCategory: "CBC", valueNumeric: 4.7, unit: "million/\u03bcL", refLow: 4.5, refHigh: 5.9, flag: "N" },
      { testName: "Fasting Blood Sugar", testCategory: "Blood Sugar", valueNumeric: 96, unit: "mg/dL", refLow: 70, refHigh: 100, flag: "N" },
      { testName: "HbA1c", testCategory: "Blood Sugar", valueNumeric: 5.9, unit: "%", refLow: null, refHigh: 5.7, flag: "H" },
      { testName: "Serum Creatinine", testCategory: "Kidney Function", valueNumeric: 0.9, unit: "mg/dL", refLow: 0.6, refHigh: 1.2, flag: "N" },
      { testName: "Blood Urea Nitrogen", testCategory: "Kidney Function", valueNumeric: 16, unit: "mg/dL", refLow: 7, refHigh: 20, flag: "N" },
      { testName: "Total Cholesterol", testCategory: "Lipid Profile", valueNumeric: 186, unit: "mg/dL", refLow: null, refHigh: 200, flag: "N" },
      { testName: "LDL Cholesterol", testCategory: "Lipid Profile", valueNumeric: 112, unit: "mg/dL", refLow: null, refHigh: 100, flag: "H" },
      { testName: "HDL Cholesterol", testCategory: "Lipid Profile", valueNumeric: 48, unit: "mg/dL", refLow: 40, refHigh: null, flag: "N" },
      { testName: "Triglycerides", testCategory: "Lipid Profile", valueNumeric: 130, unit: "mg/dL", refLow: null, refHigh: 150, flag: "N" },
      { testName: "TSH", testCategory: "Thyroid", valueNumeric: 2.9, unit: "\u03bcIU/mL", refLow: 0.4, refHigh: 4.0, flag: "N" },
      { testName: "SGPT (ALT)", testCategory: "Liver Function", valueNumeric: 28, unit: "U/L", refLow: null, refHigh: 40, flag: "N" },
      { testName: "SGOT (AST)", testCategory: "Liver Function", valueNumeric: 24, unit: "U/L", refLow: null, refHigh: 40, flag: "N" },
      { testName: "Sodium", testCategory: "Electrolytes", valueNumeric: 141, unit: "mEq/L", refLow: 135, refHigh: 145, flag: "N" },
      { testName: "Potassium", testCategory: "Electrolytes", valueNumeric: 4.0, unit: "mEq/L", refLow: 3.5, refHigh: 5.0, flag: "N" },
      { testName: "Vitamin D", testCategory: "Other", valueNumeric: 18, unit: "ng/mL", refLow: 30, refHigh: 100, flag: "L" },
      { testName: "Vitamin B12", testCategory: "Other", valueNumeric: 310, unit: "pg/mL", refLow: 200, refHigh: 900, flag: "N" },
    ],
  },
];

export async function POST() {
  try {
    let user = await prisma.user.findUnique({ where: { email: DEMO_EMAIL } });
    if (!user) {
      const hashedPassword = await bcrypt.hash(DEMO_PASSWORD, 10);
      user = await prisma.user.create({
        data: { email: DEMO_EMAIL, name: DEMO_NAME, hashedPassword },
      });
    }

    const existingPatient = await prisma.patient.findFirst({ where: { userId: user.id } });

    if (!existingPatient) {
      await prisma.patient.create({
        data: {
          userId: user.id,
          name: "Raj Kumar",
          dateOfBirth: new Date("1975-03-15"),
          sex: "Male",
          reports: {
            create: DEMO_REPORTS.map((r) => ({
              reportDate: r.reportDate,
              labName: r.labName,
              reportType: r.reportType,
              billId: r.billId,
              status: "completed",
              labValues: {
                create: r.labValues.map((lv) => ({
                  testName: lv.testName,
                  testCategory: lv.testCategory,
                  valueNumeric: lv.valueNumeric,
                  unit: lv.unit,
                  refLow: lv.refLow ?? null,
                  refHigh: lv.refHigh ?? null,
                  flag: lv.flag,
                  ocrConfidence: 1.0,
                  userVerified: true,
                })),
              },
            })),
          },
        },
      });
    }

    const token = createToken(user.id);
    return NextResponse.json({
      access_token: token,
      token_type: "bearer",
      user: { id: user.id, email: user.email, name: user.name },
    });
  } catch (error: any) {
    console.error("Demo login error:", error);
    return NextResponse.json({ detail: "Demo login failed" }, { status: 500 });
  }
       }
