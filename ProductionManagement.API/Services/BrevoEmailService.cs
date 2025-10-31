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

    public async Task<bool> SendAcquisitionCreatedAsync(
        string toEmail, 
        string userName, 
        string acquisitionTitle, 
        string acquisitionNumber, 
        string acquisitionType, 
        string createdBy, 
        string? assignedToUser = null,
        string? description = null,
        string? supplierName = null,
        string? supplierContact = null,
        string? transportCarName = null,
        string? transportPhoneNumber = null,
        DateTime? transportDate = null,
        string? transportNotes = null,
        List<AcquisitionItemEmailDto>? items = null)
    {
        var subject = $"📋 New Acquisition Created: {acquisitionTitle}";
        
        // Build description section
        var descriptionSection = !string.IsNullOrEmpty(description) 
            ? $"<p style='color: #666; margin: 15px 0;'>{description}</p>" 
            : "";
        
        // Build supplier section
        var supplierSection = "";
        if (!string.IsNullOrEmpty(supplierName))
        {
            supplierSection = $@"
                <div class='section'>
                    <h3 style='color: #2196F3; margin-top: 0;'>🏢 Supplier Information</h3>
                    <div class='details-grid'>
                        <div class='detail-row'>
                            <div class='detail-label'>Supplier:</div>
                            <div class='detail-value'>{supplierName}</div>
                        </div>
                        {(!string.IsNullOrEmpty(supplierContact) ? $@"
                        <div class='detail-row'>
                            <div class='detail-label'>Contact:</div>
                            <div class='detail-value'>{supplierContact}</div>
                        </div>" : "")}
                    </div>
                </div>";
        }
        
        // Build transport section
        var transportSection = "";
        if (!string.IsNullOrEmpty(transportCarName) || transportDate.HasValue)
        {
            transportSection = $@"
                <div class='section'>
                    <h3 style='color: #2196F3; margin-top: 0;'>🚚 Transport Details</h3>
                    <div class='details-grid'>
                        {(!string.IsNullOrEmpty(transportCarName) ? $@"
                        <div class='detail-row'>
                            <div class='detail-label'>Car Name:</div>
                            <div class='detail-value'>{transportCarName}</div>
                        </div>" : "")}
                        {(!string.IsNullOrEmpty(transportPhoneNumber) ? $@"
                        <div class='detail-row'>
                            <div class='detail-label'>Phone:</div>
                            <div class='detail-value'>{transportPhoneNumber}</div>
                        </div>" : "")}
                        {(transportDate.HasValue ? $@"
                        <div class='detail-row'>
                            <div class='detail-label'>Transport Date:</div>
                            <div class='detail-value'>{transportDate.Value:MMM dd, yyyy}</div>
                        </div>" : "")}
                        {(!string.IsNullOrEmpty(transportNotes) ? $@"
                        <div class='detail-row'>
                            <div class='detail-label'>Notes:</div>
                            <div class='detail-value'>{transportNotes}</div>
                        </div>" : "")}
                    </div>
                </div>";
        }
        
        // Build items table
        var itemsTable = "";
        if (items != null && items.Any())
        {
            var itemRows = string.Join("", items.Select(item => $@"
                        <tr>
                            <td style='padding: 12px; border-bottom: 1px solid #e0e0e0;'>{item.Name}</td>
                            <td style='padding: 12px; border-bottom: 1px solid #e0e0e0;'>{item.Color}</td>
                            <td style='padding: 12px; border-bottom: 1px solid #e0e0e0; text-align: right;'>{item.Quantity}</td>
                            <td style='padding: 12px; border-bottom: 1px solid #e0e0e0; text-align: center;'>{item.QuantityType}</td>
                        </tr>"));
            
            itemsTable = $@"
                <div class='section'>
                    <h3 style='color: #2196F3; margin-top: 0;'>📦 Materials List</h3>
                    <table style='width: 100%; border-collapse: collapse; background-color: white; box-shadow: 0 1px 3px rgba(0,0,0,0.1);'>
                        <thead>
                            <tr style='background-color: #f5f5f5;'>
                                <th style='padding: 12px; text-align: left; border-bottom: 2px solid #2196F3;'>Material Name</th>
                                <th style='padding: 12px; text-align: center; border-bottom: 2px solid #2196F3;'>Color</th>
                                <th style='padding: 12px; text-align: right; border-bottom: 2px solid #2196F3;'>Quantity</th>
                                <th style='padding: 12px; text-align: center; border-bottom: 2px solid #2196F3;'>Unit</th>
                            </tr>
                        </thead>
                        <tbody>
                            {itemRows}
                        </tbody>
                        <tfoot>
                            <tr style='background-color: #f5f5f5; font-weight: bold;'>
                                <td colspan='2' style='padding: 12px; border-top: 2px solid #2196F3;'>Total Items:</td>
                                <td colspan='2' style='padding: 12px; text-align: right; border-top: 2px solid #2196F3;'>{items.Count} material(s)</td>
                            </tr>
                        </tfoot>
                    </table>
                </div>";
        }
        
        var htmlContent = $@"
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                    .container {{ max-width: 700px; margin: 0 auto; padding: 20px; }}
                    .header {{ background: linear-gradient(135deg, #2196F3 0%, #1976D2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }}
                    .content {{ background-color: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }}
                    .info-box {{ background-color: #fff; padding: 20px; border-left: 4px solid #2196F3; margin-bottom: 20px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }}
                    .section {{ background-color: #fff; padding: 20px; margin: 20px 0; border-radius: 6px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }}
                    .details-grid {{ display: table; width: 100%; margin: 15px 0; }}
                    .detail-row {{ display: table-row; }}
                    .detail-label {{ display: table-cell; padding: 8px 15px 8px 0; font-weight: bold; width: 35%; color: #555; }}
                    .detail-value {{ display: table-cell; padding: 8px 0; color: #333; }}
                    .button {{ display: inline-block; padding: 14px 35px; background: linear-gradient(135deg, #2196F3 0%, #1976D2 100%); color: white; text-decoration: none; border-radius: 5px; margin-top: 20px; font-weight: bold; box-shadow: 0 2px 5px rgba(33,150,243,0.3); }}
                    .button:hover {{ box-shadow: 0 4px 8px rgba(33,150,243,0.4); }}
                    .footer {{ text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #666; }}
                    .badge {{ display: inline-block; padding: 6px 14px; background-color: #e3f2fd; color: #2196F3; border-radius: 15px; font-size: 12px; font-weight: bold; margin-left: 10px; }}
                    .status-badge {{ display: inline-block; padding: 6px 14px; background-color: #fff3e0; color: #f57c00; border-radius: 15px; font-size: 12px; font-weight: bold; }}
                </style>
            </head>
            <body>
                <div class='container'>
                    <div class='header'>
                        <h1 style='margin: 0; font-size: 28px;'>📋 New Acquisition Created</h1>
                        <p style='margin: 10px 0 0 0; opacity: 0.9;'>Action Required</p>
                    </div>
                    <div class='content'>
                        <div class='info-box'>
                            <h2 style='margin-top: 0; color: #2196F3;'>{acquisitionTitle}<span class='badge'>{acquisitionType}</span></h2>
                            {descriptionSection}
                            
                            <div class='details-grid'>
                                <div class='detail-row'>
                                    <div class='detail-label'>Acquisition #:</div>
                                    <div class='detail-value'><strong>{acquisitionNumber}</strong></div>
                                </div>
                                <div class='detail-row'>
                                    <div class='detail-label'>Created By:</div>
                                    <div class='detail-value'>{createdBy}</div>
                                </div>
                                {(assignedToUser != null ? $@"
                                <div class='detail-row'>
                                    <div class='detail-label'>Assigned To:</div>
                                    <div class='detail-value'><strong>{assignedToUser}</strong></div>
                                </div>" : "")}
                                <div class='detail-row'>
                                    <div class='detail-label'>Status:</div>
                                    <div class='detail-value'><span class='status-badge'>Draft</span></div>
                                </div>
                            </div>
                        </div>
                        
                        {supplierSection}
                        {transportSection}
                        {itemsTable}
                        
                        <div style='text-align: center; margin-top: 30px;'>
                            <p style='color: #666;'>Please review the acquisition details and take necessary actions.</p>
                            <a href='http://localhost:5173/acquisitions' class='button'>View Acquisition Details</a>
                        </div>
                    </div>
                    <div class='footer'>
                        <p>© 2025 Production Management System. All rights reserved.</p>
                        <p style='color: #999; margin-top: 5px;'>This is an automated notification. Please do not reply to this email.</p>
                    </div>
                </div>
            </body>
            </html>";

        return await SendEmailAsync(toEmail, userName, subject, htmlContent);
    }

    public async Task<bool> SendAcquisitionUpdatedAsync(
        string toEmail, 
        string userName, 
        string acquisitionTitle, 
        string acquisitionNumber, 
        string acquisitionType, 
        string updatedBy, 
        List<string> changes,
        string? assignedToUser = null,
        string? description = null,
        string? supplierName = null,
        string? supplierContact = null,
        string? transportCarName = null,
        string? transportPhoneNumber = null,
        DateTime? transportDate = null,
        string? transportNotes = null,
        List<AcquisitionItemEmailDto>? items = null)
    {
        var subject = $"✏️ Acquisition Updated: {acquisitionTitle}";
        
        // Build description section
        var descriptionSection = !string.IsNullOrEmpty(description) 
            ? $"<p style='color: #666; margin: 15px 0;'>{description}</p>" 
            : "";
        
        // Build changes highlight section
        var changesSection = "";
        if (changes != null && changes.Any())
        {
            var changeItems = string.Join("", changes.Select(change => $"<li style='padding: 8px 0; border-bottom: 1px solid #fff3e0;'>{change}</li>"));
            changesSection = $@"
                <div class='changes-box' style='background-color: #fff8e1; border-left: 4px solid #ffa726; padding: 20px; margin: 20px 0; border-radius: 6px;'>
                    <h3 style='color: #f57c00; margin-top: 0;'>📝 Changes Made</h3>
                    <ul style='margin: 10px 0; padding-left: 20px; list-style-type: none;'>
                        {changeItems}
                    </ul>
                </div>";
        }
        
        // Build supplier section
        var supplierSection = "";
        if (!string.IsNullOrEmpty(supplierName))
        {
            supplierSection = $@"
                <div class='section'>
                    <h3 style='color: #2196F3; margin-top: 0;'>🏢 Supplier Information</h3>
                    <div class='details-grid'>
                        <div class='detail-row'>
                            <div class='detail-label'>Supplier:</div>
                            <div class='detail-value'>{supplierName}</div>
                        </div>
                        {(!string.IsNullOrEmpty(supplierContact) ? $@"
                        <div class='detail-row'>
                            <div class='detail-label'>Contact:</div>
                            <div class='detail-value'>{supplierContact}</div>
                        </div>" : "")}
                    </div>
                </div>";
        }
        
        // Build transport section
        var transportSection = "";
        if (!string.IsNullOrEmpty(transportCarName) || transportDate.HasValue)
        {
            transportSection = $@"
                <div class='section'>
                    <h3 style='color: #2196F3; margin-top: 0;'>🚚 Transport Details</h3>
                    <div class='details-grid'>
                        {(!string.IsNullOrEmpty(transportCarName) ? $@"
                        <div class='detail-row'>
                            <div class='detail-label'>Car Name:</div>
                            <div class='detail-value'>{transportCarName}</div>
                        </div>" : "")}
                        {(!string.IsNullOrEmpty(transportPhoneNumber) ? $@"
                        <div class='detail-row'>
                            <div class='detail-label'>Phone:</div>
                            <div class='detail-value'>{transportPhoneNumber}</div>
                        </div>" : "")}
                        {(transportDate.HasValue ? $@"
                        <div class='detail-row'>
                            <div class='detail-label'>Transport Date:</div>
                            <div class='detail-value'>{transportDate.Value:MMM dd, yyyy}</div>
                        </div>" : "")}
                        {(!string.IsNullOrEmpty(transportNotes) ? $@"
                        <div class='detail-row'>
                            <div class='detail-label'>Notes:</div>
                            <div class='detail-value'>{transportNotes}</div>
                        </div>" : "")}
                    </div>
                </div>";
        }
        
        // Build items table
        var itemsTable = "";
        if (items != null && items.Any())
        {
            var itemRows = string.Join("", items.Select(item => $@"
                        <tr>
                            <td style='padding: 12px; border-bottom: 1px solid #e0e0e0;'>{item.Name}</td>
                            <td style='padding: 12px; border-bottom: 1px solid #e0e0e0;'>{item.Color}</td>
                            <td style='padding: 12px; border-bottom: 1px solid #e0e0e0; text-align: right;'>{item.Quantity}</td>
                            <td style='padding: 12px; border-bottom: 1px solid #e0e0e0; text-align: center;'>{item.QuantityType}</td>
                        </tr>"));
            
            itemsTable = $@"
                <div class='section'>
                    <h3 style='color: #2196F3; margin-top: 0;'>📦 Materials List</h3>
                    <table style='width: 100%; border-collapse: collapse; background-color: white; box-shadow: 0 1px 3px rgba(0,0,0,0.1);'>
                        <thead>
                            <tr style='background-color: #f5f5f5;'>
                                <th style='padding: 12px; text-align: left; border-bottom: 2px solid #2196F3;'>Material Name</th>
                                <th style='padding: 12px; text-align: left; border-bottom: 2px solid #2196F3;'>Color</th>
                                <th style='padding: 12px; text-align: right; border-bottom: 2px solid #2196F3;'>Quantity</th>
                                <th style='padding: 12px; text-align: center; border-bottom: 2px solid #2196F3;'>Unit</th>
                            </tr>
                        </thead>
                        <tbody>
                            {itemRows}
                        </tbody>
                        <tfoot>
                            <tr style='background-color: #f5f5f5; font-weight: bold;'>
                                <td colspan='2' style='padding: 12px; border-top: 2px solid #2196F3;'>Total Items:</td>
                                <td colspan='2' style='padding: 12px; text-align: right; border-top: 2px solid #2196F3;'>{items.Count} material(s)</td>
                            </tr>
                        </tfoot>
                    </table>
                </div>";
        }
        
        var htmlContent = $@"
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                    .container {{ max-width: 700px; margin: 0 auto; padding: 20px; }}
                    .header {{ background: linear-gradient(135deg, #ff9800 0%, #f57c00 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }}
                    .content {{ background-color: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }}
                    .info-box {{ background-color: #fff; padding: 20px; border-left: 4px solid #ff9800; margin-bottom: 20px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }}
                    .section {{ background-color: #fff; padding: 20px; margin: 20px 0; border-radius: 6px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }}
                    .details-grid {{ display: table; width: 100%; margin: 15px 0; }}
                    .detail-row {{ display: table-row; }}
                    .detail-label {{ display: table-cell; padding: 8px 15px 8px 0; font-weight: bold; width: 35%; color: #555; }}
                    .detail-value {{ display: table-cell; padding: 8px 0; color: #333; }}
                    .button {{ display: inline-block; padding: 14px 35px; background: linear-gradient(135deg, #ff9800 0%, #f57c00 100%); color: white; text-decoration: none; border-radius: 5px; margin-top: 20px; font-weight: bold; box-shadow: 0 2px 5px rgba(255,152,0,0.3); }}
                    .button:hover {{ box-shadow: 0 4px 8px rgba(255,152,0,0.4); }}
                    .footer {{ text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #666; }}
                    .badge {{ display: inline-block; padding: 6px 14px; background-color: #fff3e0; color: #ff9800; border-radius: 15px; font-size: 12px; font-weight: bold; margin-left: 10px; }}
                    .status-badge {{ display: inline-block; padding: 6px 14px; background-color: #fff3e0; color: #f57c00; border-radius: 15px; font-size: 12px; font-weight: bold; }}
                </style>
            </head>
            <body>
                <div class='container'>
                    <div class='header'>
                        <h1 style='margin: 0; font-size: 28px;'>✏️ Acquisition Updated</h1>
                        <p style='margin: 10px 0 0 0; opacity: 0.9;'>Changes Made</p>
                    </div>
                    <div class='content'>
                        <div class='info-box'>
                            <h2 style='margin-top: 0; color: #ff9800;'>{acquisitionTitle}<span class='badge'>{acquisitionType}</span></h2>
                            {descriptionSection}
                            
                            <div class='details-grid'>
                                <div class='detail-row'>
                                    <div class='detail-label'>Acquisition #:</div>
                                    <div class='detail-value'><strong>{acquisitionNumber}</strong></div>
                                </div>
                                <div class='detail-row'>
                                    <div class='detail-label'>Updated By:</div>
                                    <div class='detail-value'>{updatedBy}</div>
                                </div>
                                {(assignedToUser != null ? $@"
                                <div class='detail-row'>
                                    <div class='detail-label'>Assigned To:</div>
                                    <div class='detail-value'><strong>{assignedToUser}</strong></div>
                                </div>" : "")}
                                <div class='detail-row'>
                                    <div class='detail-label'>Status:</div>
                                    <div class='detail-value'><span class='status-badge'>Draft</span></div>
                                </div>
                            </div>
                        </div>
                        
                        {changesSection}
                        {supplierSection}
                        {transportSection}
                        {itemsTable}
                        
                        <div style='text-align: center; margin-top: 30px;'>
                            <p style='color: #666;'>The acquisition has been updated. Please review the changes.</p>
                            <a href='http://localhost:5173/acquisitions' class='button'>View Acquisition Details</a>
                        </div>
                    </div>
                    <div class='footer'>
                        <p>© 2025 Production Management System. All rights reserved.</p>
                        <p style='color: #999; margin-top: 5px;'>This is an automated notification. Please do not reply to this email.</p>
                    </div>
                </div>
            </body>
            </html>";

        return await SendEmailAsync(toEmail, userName, subject, htmlContent);
    }

    public async Task<bool> SendAcquisitionDeletedAsync(
        string toEmail, 
        string userName, 
        string acquisitionTitle, 
        string acquisitionNumber, 
        string acquisitionType, 
        string deletedBy, 
        string? assignedToUser = null,
        string? description = null,
        string? supplierName = null,
        string? supplierContact = null,
        string? transportCarName = null,
        string? transportPhoneNumber = null,
        DateTime? transportDate = null,
        string? transportNotes = null,
        List<AcquisitionItemEmailDto>? items = null)
    {
        var subject = $"🗑️ Acquisition Deleted: {acquisitionTitle}";
        
        // Build description section
        var descriptionSection = !string.IsNullOrEmpty(description) 
            ? $"<p style='color: #666; margin: 15px 0;'>{description}</p>" 
            : "";
        
        // Build supplier section
        var supplierSection = "";
        if (!string.IsNullOrEmpty(supplierName))
        {
            supplierSection = $@"
                <div class='section'>
                    <h3 style='color: #e53935; margin-top: 0;'>🏢 Supplier Information</h3>
                    <div class='details-grid'>
                        <div class='detail-row'>
                            <div class='detail-label'>Supplier:</div>
                            <div class='detail-value'>{supplierName}</div>
                        </div>
                        {(!string.IsNullOrEmpty(supplierContact) ? $@"
                        <div class='detail-row'>
                            <div class='detail-label'>Contact:</div>
                            <div class='detail-value'>{supplierContact}</div>
                        </div>" : "")}
                    </div>
                </div>";
        }
        
        // Build transport section
        var transportSection = "";
        if (!string.IsNullOrEmpty(transportCarName) || transportDate.HasValue)
        {
            transportSection = $@"
                <div class='section'>
                    <h3 style='color: #e53935; margin-top: 0;'>🚚 Transport Details</h3>
                    <div class='details-grid'>
                        {(!string.IsNullOrEmpty(transportCarName) ? $@"
                        <div class='detail-row'>
                            <div class='detail-label'>Car Name:</div>
                            <div class='detail-value'>{transportCarName}</div>
                        </div>" : "")}
                        {(!string.IsNullOrEmpty(transportPhoneNumber) ? $@"
                        <div class='detail-row'>
                            <div class='detail-label'>Phone:</div>
                            <div class='detail-value'>{transportPhoneNumber}</div>
                        </div>" : "")}
                        {(transportDate.HasValue ? $@"
                        <div class='detail-row'>
                            <div class='detail-label'>Transport Date:</div>
                            <div class='detail-value'>{transportDate.Value:MMM dd, yyyy}</div>
                        </div>" : "")}
                        {(!string.IsNullOrEmpty(transportNotes) ? $@"
                        <div class='detail-row'>
                            <div class='detail-label'>Notes:</div>
                            <div class='detail-value'>{transportNotes}</div>
                        </div>" : "")}
                    </div>
                </div>";
        }
        
        // Build items table
        var itemsTable = "";
        if (items != null && items.Any())
        {
            var itemRows = string.Join("", items.Select(item => $@"
                        <tr>
                            <td style='padding: 12px; border-bottom: 1px solid #e0e0e0; text-decoration: line-through; color: #999;'>{item.Name}</td>
                            <td style='padding: 12px; border-bottom: 1px solid #e0e0e0; text-decoration: line-through; color: #999;'>{item.Color}</td>
                            <td style='padding: 12px; border-bottom: 1px solid #e0e0e0; text-align: right; text-decoration: line-through; color: #999;'>{item.Quantity}</td>
                            <td style='padding: 12px; border-bottom: 1px solid #e0e0e0; text-align: center; text-decoration: line-through; color: #999;'>{item.QuantityType}</td>
                        </tr>"));
            
            itemsTable = $@"
                <div class='section'>
                    <h3 style='color: #e53935; margin-top: 0;'>📦 Materials List (Cancelled)</h3>
                    <table style='width: 100%; border-collapse: collapse; background-color: white; box-shadow: 0 1px 3px rgba(0,0,0,0.1);'>
                        <thead>
                            <tr style='background-color: #f5f5f5;'>
                                <th style='padding: 12px; text-align: left; border-bottom: 2px solid #e53935;'>Material Name</th>
                                <th style='padding: 12px; text-align: left; border-bottom: 2px solid #e53935;'>Color</th>
                                <th style='padding: 12px; text-align: right; border-bottom: 2px solid #e53935;'>Quantity</th>
                                <th style='padding: 12px; text-align: center; border-bottom: 2px solid #e53935;'>Unit</th>
                            </tr>
                        </thead>
                        <tbody>
                            {itemRows}
                        </tbody>
                        <tfoot>
                            <tr style='background-color: #ffebee; font-weight: bold;'>
                                <td colspan='2' style='padding: 12px; border-top: 2px solid #e53935;'>Total Items (Cancelled):</td>
                                <td colspan='2' style='padding: 12px; text-align: right; border-top: 2px solid #e53935;'>{items.Count} material(s)</td>
                            </tr>
                        </tfoot>
                    </table>
                </div>";
        }
        
        var htmlContent = $@"
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                    .container {{ max-width: 700px; margin: 0 auto; padding: 20px; }}
                    .header {{ background: linear-gradient(135deg, #f44336 0%, #d32f2f 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }}
                    .content {{ background-color: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }}
                    .info-box {{ background-color: #fff; padding: 20px; border-left: 4px solid #f44336; margin-bottom: 20px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }}
                    .section {{ background-color: #fff; padding: 20px; margin: 20px 0; border-radius: 6px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }}
                    .details-grid {{ display: table; width: 100%; margin: 15px 0; }}
                    .detail-row {{ display: table-row; }}
                    .detail-label {{ display: table-cell; padding: 8px 15px 8px 0; font-weight: bold; width: 35%; color: #555; }}
                    .detail-value {{ display: table-cell; padding: 8px 0; color: #333; }}
                    .button {{ display: inline-block; padding: 14px 35px; background: linear-gradient(135deg, #f44336 0%, #d32f2f 100%); color: white; text-decoration: none; border-radius: 5px; margin-top: 20px; font-weight: bold; box-shadow: 0 2px 5px rgba(244,67,54,0.3); }}
                    .button:hover {{ box-shadow: 0 4px 8px rgba(244,67,54,0.4); }}
                    .footer {{ text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #666; }}
                    .badge {{ display: inline-block; padding: 6px 14px; background-color: #ffebee; color: #f44336; border-radius: 15px; font-size: 12px; font-weight: bold; margin-left: 10px; }}
                    .status-badge {{ display: inline-block; padding: 6px 14px; background-color: #ffebee; color: #d32f2f; border-radius: 15px; font-size: 12px; font-weight: bold; }}
                    .alert-box {{ background-color: #ffebee; border-left: 4px solid #f44336; padding: 20px; margin: 20px 0; border-radius: 6px; }}
                </style>
            </head>
            <body>
                <div class='container'>
                    <div class='header'>
                        <h1 style='margin: 0; font-size: 28px;'>🗑️ Acquisition Deleted</h1>
                        <p style='margin: 10px 0 0 0; opacity: 0.9;'>Cancelled</p>
                    </div>
                    <div class='content'>
                        <div class='alert-box'>
                            <h3 style='margin-top: 0; color: #d32f2f;'>⚠️ This acquisition has been deleted</h3>
                            <p style='margin-bottom: 0; color: #666;'>The following acquisition has been cancelled and removed from the active list.</p>
                        </div>
                        
                        <div class='info-box'>
                            <h2 style='margin-top: 0; color: #f44336;'>{acquisitionTitle}<span class='badge'>{acquisitionType}</span></h2>
                            {descriptionSection}
                            
                            <div class='details-grid'>
                                <div class='detail-row'>
                                    <div class='detail-label'>Acquisition #:</div>
                                    <div class='detail-value'><strong>{acquisitionNumber}</strong></div>
                                </div>
                                <div class='detail-row'>
                                    <div class='detail-label'>Deleted By:</div>
                                    <div class='detail-value'>{deletedBy}</div>
                                </div>
                                {(assignedToUser != null ? $@"
                                <div class='detail-row'>
                                    <div class='detail-label'>Was Assigned To:</div>
                                    <div class='detail-value'><strong>{assignedToUser}</strong></div>
                                </div>" : "")}
                                <div class='detail-row'>
                                    <div class='detail-label'>Status:</div>
                                    <div class='detail-value'><span class='status-badge'>Deleted</span></div>
                                </div>
                            </div>
                        </div>
                        
                        {supplierSection}
                        {transportSection}
                        {itemsTable}
                        
                        <div style='text-align: center; margin-top: 30px;'>
                            <p style='color: #666;'>This acquisition has been permanently removed from the system.</p>
                            <a href='http://localhost:5173/acquisitions' class='button'>View All Acquisitions</a>
                        </div>
                    </div>
                    <div class='footer'>
                        <p>© 2025 Production Management System. All rights reserved.</p>
                        <p style='color: #999; margin-top: 5px;'>This is an automated notification. Please do not reply to this email.</p>
                    </div>
                </div>
            </body>
            </html>";

        return await SendEmailAsync(toEmail, userName, subject, htmlContent);
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

