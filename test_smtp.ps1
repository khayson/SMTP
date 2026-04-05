$smtp = New-Object Net.Mail.SmtpClient("127.0.0.1", 1025)
$msg = New-Object Net.Mail.MailMessage
$msg.From = "test@forgemail.dev"
$msg.To.Add("user@forgemail.dev")
$msg.Subject = "Test Signal v1.2.9"
$msg.Body = "This is a detailed test signal to verify the SMTP pipeline fixes."
$smtp.Send($msg)
Write-Host "Signal dispatched successfully."
