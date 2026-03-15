export interface EmailLayoutOptions {
  companyName: string;
  title: string;
  content: string;
  timestamp: number;
}

export const emailLayout = (options: EmailLayoutOptions) => `
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<title>${options.title}</title>
</head>

<body style="margin:0;padding:0;background-color:#f5f7fb;font-family:Arial,Helvetica,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 0;background-color:#f5f7fb;">
<tr>
<td align="center">

<table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:8px;padding:40px;">

<tr>
<td style="text-align:center;padding-bottom:20px;">
<h2 style="margin:0;color:#333;">${options.title}</h2>
</td>
</tr>

<tr>
<td style="color:#444;font-size:15px;line-height:1.6;">
${options.content}
</td>
</tr>

<tr>
<td style="padding-top:30px;border-top:1px solid #eee;color:#999;font-size:12px;text-align:center;">
© ${new Date(options.timestamp).getFullYear()} ${options.companyName}
</td>
</tr>

</table>

</td>
</tr>
</table>
</body>
</html>
`;
