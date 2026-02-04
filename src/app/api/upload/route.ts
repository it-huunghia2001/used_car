/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { google } from "googleapis";
import { Readable } from "stream";

async function getDriveService() {
  const privateKey = process.env.GOOGLE_PRIVATE_KEY;
  const clientEmail = process.env.GOOGLE_CLIENT_EMAIL;

  // SỬA LỖI TẠI ĐÂY: Truyền vào 1 object duy nhất
  const auth = new google.auth.JWT({
    email: clientEmail,
    key: privateKey?.replace(/\\n/g, "\n").replace(/"/g, ""),
    scopes: ["https://www.googleapis.com/auth/drive"],
    subject: "nghia.hh@toyota.binhduong.vn", // Email chủ sở hữu Drive
  });

  return google.drive({ version: "v3", auth });
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    if (!file)
      return NextResponse.json(
        { error: "Không tìm thấy file" },
        { status: 400 },
      );

    const drive = await getDriveService();
    const buffer = Buffer.from(await file.arrayBuffer());
    const stream = new Readable();
    stream.push(buffer);
    stream.push(null);

    // Upload tệp tin
    const response = await drive.files.create({
      requestBody: {
        name: `HD_${Date.now()}_${file.name.replace(/\s+/g, "_")}`,
        parents: process.env.GOOGLE_DRIVE_FOLDER_ID
          ? [process.env.GOOGLE_DRIVE_FOLDER_ID]
          : [],
      },
      media: {
        mimeType: file.type,
        body: stream,
      },
      fields: "id, webViewLink",
    });

    // Phân quyền để có thể xem được từ CRM
    if (response.data.id) {
      await drive.permissions.create({
        fileId: response.data.id,
        requestBody: { role: "reader", type: "anyone" },
      });
    }

    return NextResponse.json({
      success: true,
      url: response.data.webViewLink,
      fileId: response.data.id,
    });
  } catch (error: any) {
    console.error("🔥 Drive Error:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
