using System.Text;
using System.Text.Json;

namespace ProductionManagement.API.Services;

public class BrevoEmailService : IEmailService
{
    private readonly HttpClient _httpClient;
    private readonly string _apiKey;
    private readonly string _senderEmail;
    private readonly string _senderName;
    private readonly ILogger<BrevoEmailService> _logger;

    public BrevoEmailService(
        IHttpClientFactory httpClientFactory,
        IConfiguration configuration,
        ILogger<BrevoEmailService> logger)
    {
        _httpClient = httpClientFactory.CreateClient();
        _apiKey = configuration["Brevo:ApiKey"] ?? throw new ArgumentNullException("Brevo:ApiKey not configured");
        _senderEmail = configuration["Brevo:SenderEmail"] ?? throw new ArgumentNullException("Brevo:SenderEmail not configured");
        _senderName = configuration["Brevo:SenderName"] ?? "Production Management System";
        _logger = logger;

        _httpClient.BaseAddress = new Uri("https://api.brevo.com/v3/");
        _httpClient.DefaultRequestHeaders.Add("api-key", _apiKey);
        _httpClient.DefaultRequestHeaders.Add("accept", "application/json");
    }

    public async Task<bool> SendEmailAsync(string toEmail, string toName, string subject, string htmlContent, string? textContent = null)
    {
        try
        {
            var emailRequest = new
            {
                sender = new
                {
                    email = _senderEmail,
                    name = _senderName
                },
                to = new[]
                {
                    new
                    {
                        email = toEmail,
                        name = toName
                    }
                },
                subject = subject,
                htmlContent = htmlContent,
                textContent = textContent ?? StripHtml(htmlContent)
            };

            var json = JsonSerializer.Serialize(emailRequest);
            var content = new StringContent(json, Encoding.UTF8, "application/json");

            var response = await _httpClient.PostAsync("smtp/email", content);

            if (response.IsSuccessStatusCode)
            {
                _logger.LogInformation("Email sent successfully to {Email}", toEmail);
                return true;
            }

            var errorContent = await response.Content.ReadAsStringAsync();
            _logger.LogError("Failed to send email to {Email}. Status: {Status}, Error: {Error}",
                toEmail, response.StatusCode, errorContent);
            return false;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Exception occurred while sending email to {Email}", toEmail);
            return false;
        }
    }

    public async Task<bool> SendWelcomeEmailAsync(string toEmail, string userName, string temporaryPassword)
    {
        var subject = "Welcome to Production Management System";
        var htmlContent = $@"
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                    .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                    .header {{ background-color: #4CAF50; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }}
                    .content {{ background-color: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }}
                    .credentials {{ background-color: #fff; padding: 15px; border-left: 4px solid #4CAF50; margin: 20px 0; }}
                    .button {{ display: inline-block; padding: 12px 30px; background-color: #4CAF50; color: white; text-decoration: none; border-radius: 5px; margin-top: 20px; }}
                    .footer {{ text-align: center; margin-top: 20px; font-size: 12px; color: #666; }}
                </style>
            </head>
            <body>
                <div class='container'>
                    <div class='header'>
                        <h1>Welcome to Production Management!</h1>
                    </div>
                    <div class='content'>
                        <h2>Hello {userName},</h2>
                        <p>Your account has been successfully created. You can now access the Production Management System.</p>
                        
                        <div class='credentials'>
                            <h3>Your Login Credentials:</h3>
                            <p><strong>Email:</strong> {toEmail}</p>
                            <p><strong>Temporary Password:</strong> {temporaryPassword}</p>
                        </div>
                        
                        <p><strong>⚠️ Important:</strong> Please change your password after your first login for security purposes.</p>
                        
                        <a href='http://localhost:5173/login' class='button'>Login Now</a>
                        
                        <p style='margin-top: 30px;'>If you have any questions, please contact your system administrator.</p>
                    </div>
                    <div class='footer'>
                        <p>© 2025 Production Management System. All rights reserved.</p>
                    </div>
                </div>
            </body>
            </html>";

        return await SendEmailAsync(toEmail, userName, subject, htmlContent);
    }

    public async Task<bool> SendPasswordResetEmailAsync(string toEmail, string userName, string resetLink)
    {
        var subject = "Password Reset Request";
        var htmlContent = $@"
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                    .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                    .header {{ background-color: #2196F3; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }}
                    .content {{ background-color: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }}
                    .button {{ display: inline-block; padding: 12px 30px; background-color: #2196F3; color: white; text-decoration: none; border-radius: 5px; margin-top: 20px; }}
                    .warning {{ background-color: #fff3cd; padding: 15px; border-left: 4px solid #ffc107; margin: 20px 0; }}
                    .footer {{ text-align: center; margin-top: 20px; font-size: 12px; color: #666; }}
                </style>
            </head>
            <body>
                <div class='container'>
                    <div class='header'>
                        <h1>Password Reset Request</h1>
                    </div>
                    <div class='content'>
                        <h2>Hello {userName},</h2>
                        <p>We received a request to reset your password for your Production Management account.</p>
                        
                        <p>Click the button below to reset your password:</p>
                        
                        <a href='{resetLink}' class='button'>Reset Password</a>
                        
                        <div class='warning'>
                            <p><strong>⚠️ Security Notice:</strong></p>
                            <p>This link will expire in 24 hours. If you didn't request this password reset, please ignore this email and your password will remain unchanged.</p>
                        </div>
                        
                        <p>If the button doesn't work, copy and paste this link into your browser:</p>
                        <p style='word-break: break-all; color: #2196F3;'>{resetLink}</p>
                    </div>
                    <div class='footer'>
                        <p>© 2025 Production Management System. All rights reserved.</p>
                    </div>
                </div>
            </body>
            </html>";

        return await SendEmailAsync(toEmail, userName, subject, htmlContent);
    }

    public async Task<bool> SendLowStockAlertAsync(string toEmail, string materialName, int currentStock, int minimumStock)
    {
        var subject = $"⚠️ Low Stock Alert: {materialName}";
        var htmlContent = $@"
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                    .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                    .header {{ background-color: #FF9800; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }}
                    .content {{ background-color: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }}
                    .alert {{ background-color: #fff; padding: 20px; border-left: 4px solid #FF9800; margin: 20px 0; }}
                    .stats {{ display: flex; justify-content: space-around; margin: 20px 0; }}
                    .stat {{ text-align: center; }}
                    .stat-value {{ font-size: 32px; font-weight: bold; color: #FF9800; }}
                    .stat-label {{ font-size: 14px; color: #666; }}
                    .button {{ display: inline-block; padding: 12px 30px; background-color: #FF9800; color: white; text-decoration: none; border-radius: 5px; margin-top: 20px; }}
                    .footer {{ text-align: center; margin-top: 20px; font-size: 12px; color: #666; }}
                </style>
            </head>
            <body>
                <div class='container'>
                    <div class='header'>
                        <h1>⚠️ Low Stock Alert</h1>
                    </div>
                    <div class='content'>
                        <div class='alert'>
                            <h2>Material: {materialName}</h2>
                            <p>The stock level for this material has fallen below the minimum threshold.</p>
                            
                            <div class='stats'>
                                <div class='stat'>
                                    <div class='stat-value'>{currentStock}</div>
                                    <div class='stat-label'>Current Stock</div>
                                </div>
                                <div class='stat'>
                                    <div class='stat-value'>{minimumStock}</div>
                                    <div class='stat-label'>Minimum Required</div>
                                </div>
                                <div class='stat'>
                                    <div class='stat-value'>{minimumStock - currentStock}</div>
                                    <div class='stat-label'>Shortage</div>
                                </div>
                            </div>
                            
                            <p><strong>Action Required:</strong> Please create a new acquisition to replenish this material.</p>
                        </div>
                        
                        <a href='http://localhost:5173/acquisitions' class='button'>Create Acquisition</a>
                    </div>
                    <div class='footer'>
                        <p>© 2025 Production Management System. All rights reserved.</p>
                    </div>
                </div>
            </body>
            </html>";

        return await SendEmailAsync(toEmail, "Inventory Manager", subject, htmlContent);
    }

    public async Task<bool> SendAcquisitionReceivedAsync(string toEmail, string acquisitionNumber, string supplierName)
    {
        var subject = $"✅ Acquisition Received: #{acquisitionNumber}";
        var htmlContent = $@"
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                    .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                    .header {{ background-color: #4CAF50; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }}
                    .content {{ background-color: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }}
                    .info-box {{ background-color: #fff; padding: 20px; border-left: 4px solid #4CAF50; margin: 20px 0; }}
                    .button {{ display: inline-block; padding: 12px 30px; background-color: #4CAF50; color: white; text-decoration: none; border-radius: 5px; margin-top: 20px; }}
                    .footer {{ text-align: center; margin-top: 20px; font-size: 12px; color: #666; }}
                </style>
            </head>
            <body>
                <div class='container'>
                    <div class='header'>
                        <h1>✅ Acquisition Received</h1>
                    </div>
                    <div class='content'>
                        <div class='info-box'>
                            <h2>Acquisition #{acquisitionNumber}</h2>
                            <p><strong>Supplier:</strong> {supplierName}</p>
                            <p><strong>Status:</strong> Received and added to inventory</p>
                            <p>The materials from this acquisition have been successfully received and are now available in the inventory.</p>
                        </div>
                        
                        <a href='http://localhost:5173/acquisitions' class='button'>View Acquisitions</a>
                    </div>
                    <div class='footer'>
                        <p>© 2025 Production Management System. All rights reserved.</p>
                    </div>
                </div>
            </body>
            </html>";

        return await SendEmailAsync(toEmail, "User", subject, htmlContent);
    }

    public async Task<bool> SendProductionCompletedAsync(string toEmail, string productionPlanName, int quantityProduced)
    {
        var subject = $"✅ Production Completed: {productionPlanName}";
        var htmlContent = $@"
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                    .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                    .header {{ background-color: #4CAF50; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }}
                    .content {{ background-color: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }}
                    .info-box {{ background-color: #fff; padding: 20px; border-left: 4px solid #4CAF50; margin: 20px 0; }}
                    .highlight {{ font-size: 32px; font-weight: bold; color: #4CAF50; text-align: center; margin: 20px 0; }}
                    .button {{ display: inline-block; padding: 12px 30px; background-color: #4CAF50; color: white; text-decoration: none; border-radius: 5px; margin-top: 20px; }}
                    .footer {{ text-align: center; margin-top: 20px; font-size: 12px; color: #666; }}
                </style>
            </head>
            <body>
                <div class='container'>
                    <div class='header'>
                        <h1>✅ Production Completed</h1>
                    </div>
                    <div class='content'>
                        <div class='info-box'>
                            <h2>{productionPlanName}</h2>
                            <div class='highlight'>{quantityProduced} Units Produced</div>
                            <p>The production has been successfully completed and the products have been added to the inventory.</p>
                        </div>
                        
                        <a href='http://localhost:5173/production' class='button'>View Production Plans</a>
                    </div>
                    <div class='footer'>
                        <p>© 2025 Production Management System. All rights reserved.</p>
                    </div>
                </div>
            </body>
            </html>";

        return await SendEmailAsync(toEmail, "Production Manager", subject, htmlContent);
    }

    public async Task<bool> SendOrderProcessedAsync(string toEmail, string clientName, string orderNumber)
    {
        var subject = $"✅ Order Processed: #{orderNumber}";
        var htmlContent = $@"
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                    .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                    .header {{ background-color: #2196F3; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }}
                    .content {{ background-color: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }}
                    .info-box {{ background-color: #fff; padding: 20px; border-left: 4px solid #2196F3; margin: 20px 0; }}
                    .button {{ display: inline-block; padding: 12px 30px; background-color: #2196F3; color: white; text-decoration: none; border-radius: 5px; margin-top: 20px; }}
                    .footer {{ text-align: center; margin-top: 20px; font-size: 12px; color: #666; }}
                </style>
            </head>
            <body>
                <div class='container'>
                    <div class='header'>
                        <h1>✅ Order Processed</h1>
                    </div>
                    <div class='content'>
                        <div class='info-box'>
                            <h2>Order #{orderNumber}</h2>
                            <p><strong>Client:</strong> {clientName}</p>
                            <p><strong>Status:</strong> Processing</p>
                            <p>The order has been successfully processed and is being prepared for shipment.</p>
                        </div>
                        
                        <a href='http://localhost:5173/orders' class='button'>View Orders</a>
                    </div>
                    <div class='footer'>
                        <p>© 2025 Production Management System. All rights reserved.</p>
                    </div>
                </div>
            </body>
            </html>";

        return await SendEmailAsync(toEmail, clientName, subject, htmlContent);
    }

    private string StripHtml(string html)
    {
        // Simple HTML stripping for text fallback
        return System.Text.RegularExpressions.Regex.Replace(html, "<.*?>", string.Empty);
    }
}

