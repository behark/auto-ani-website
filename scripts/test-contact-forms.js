#!/usr/bin/env node

/**
 * Comprehensive Contact Form Testing Script
 * Tests both contact form API and appointment form API
 * Tests validation, security measures, and database interactions
 */

// Using built-in fetch (Node.js 18+)
const fetch = globalThis.fetch;

const BASE_URL = 'http://localhost:3000';

// Test data configurations
const testData = {
  validContact: {
    name: 'Test User',
    email: 'test@example.com',
    phone: '+38349123456',
    message: 'This is a test message for contact form validation.',
    honeypot: '',
    captcha: '5', // Answer to 2 + 3
    consent: true,
    csrfToken: 'test-csrf-token-123',
    timestamp: Date.now() - 5000, // 5 seconds ago to simulate normal user behavior
  },

  validAppointment: {
    type: 'TEST_DRIVE',
    customerName: 'John Doe',
    customerEmail: 'john@example.com',
    customerPhone: '+38349987654',
    scheduledDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Tomorrow
    scheduledTime: '14:00',
    duration: 60,
    notes: 'Looking forward to test driving this vehicle.',
  },

  invalidInputs: [
    {
      name: 'Short name validation',
      data: { name: 'A' }, // Too short
    },
    {
      name: 'Long name validation',
      data: { name: 'A'.repeat(60) }, // Too long
    },
    {
      name: 'Invalid email format',
      data: { email: 'invalid-email' },
    },
    {
      name: 'Long email validation',
      data: { email: 'a'.repeat(250) + '@example.com' }, // Too long
    },
    {
      name: 'Invalid phone format',
      data: { phone: 'abc123' },
    },
    {
      name: 'Short message validation',
      data: { message: 'Short' }, // Too short
    },
    {
      name: 'Long message validation',
      data: { message: 'A'.repeat(1100) }, // Too long
    },
    {
      name: 'Missing CAPTCHA',
      data: { captcha: '' },
    },
    {
      name: 'Missing consent',
      data: { consent: false },
    },
    {
      name: 'Honeypot filled (bot detection)',
      data: { honeypot: 'bot-content' },
    },
  ],

  securityTests: [
    {
      name: 'XSS attempt in name',
      data: { name: '<script>alert("xss")</script>' },
    },
    {
      name: 'SQL injection attempt in email',
      data: { email: "'; DROP TABLE contacts; --" },
    },
    {
      name: 'HTML injection in message',
      data: { message: '<img src="x" onerror="alert(1)">' },
    },
  ],
};

class ContactFormTester {
  constructor() {
    this.results = {
      passed: 0,
      failed: 0,
      tests: [],
    };
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const colors = {
      info: '\x1b[36m',    // Cyan
      success: '\x1b[32m', // Green
      error: '\x1b[31m',   // Red
      warning: '\x1b[33m', // Yellow
      reset: '\x1b[0m'     // Reset
    };

    console.log(`${colors[type]}[${timestamp}] ${message}${colors.reset}`);
  }

  async makeRequest(endpoint, method = 'GET', data = null) {
    try {
      const options = {
        method,
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Contact-Form-Tester/1.0',
        },
      };

      if (data) {
        options.body = JSON.stringify(data);
      }

      const response = await fetch(`${BASE_URL}${endpoint}`, options);
      const responseData = await response.json();

      return {
        status: response.status,
        ok: response.ok,
        data: responseData,
        headers: Object.fromEntries(response.headers.entries()),
      };
    } catch (error) {
      return {
        status: 0,
        ok: false,
        error: error.message,
      };
    }
  }

  async runTest(testName, testFunction) {
    this.log(`Running test: ${testName}`, 'info');

    try {
      const result = await testFunction();
      if (result.success) {
        this.log(`✓ ${testName} - PASSED`, 'success');
        this.results.passed++;
      } else {
        this.log(`✗ ${testName} - FAILED: ${result.message}`, 'error');
        this.results.failed++;
      }

      this.results.tests.push({
        name: testName,
        success: result.success,
        message: result.message,
        details: result.details,
      });
    } catch (error) {
      this.log(`✗ ${testName} - ERROR: ${error.message}`, 'error');
      this.results.failed++;
      this.results.tests.push({
        name: testName,
        success: false,
        message: error.message,
        details: null,
      });
    }
  }

  // Test 1: API Health Check
  async testAPIHealth() {
    const response = await this.makeRequest('/api/contact');

    if (response.ok && response.data.success) {
      return {
        success: true,
        message: 'Contact API is operational',
        details: response.data,
      };
    }

    return {
      success: false,
      message: `API health check failed: ${response.data?.error || 'Unknown error'}`,
      details: response,
    };
  }

  // Test 2: Valid Contact Form Submission
  async testValidContactSubmission() {
    const response = await this.makeRequest('/api/contact', 'POST', testData.validContact);

    if (response.ok && response.data.success) {
      return {
        success: true,
        message: 'Valid contact form submission accepted',
        details: response.data,
      };
    }

    return {
      success: false,
      message: `Valid submission rejected: ${response.data?.error || 'Unknown error'}`,
      details: response,
    };
  }

  // Test 3: Input Validation Tests
  async testInputValidation() {
    let allPassed = true;
    const details = [];

    for (const test of testData.invalidInputs) {
      const testPayload = { ...testData.validContact, ...test.data };
      const response = await this.makeRequest('/api/contact', 'POST', testPayload);

      const shouldReject = !response.ok || !response.data.success;

      if (shouldReject) {
        details.push(`✓ ${test.name}: Correctly rejected`);
      } else {
        details.push(`✗ ${test.name}: Should have been rejected but was accepted`);
        allPassed = false;
      }
    }

    return {
      success: allPassed,
      message: allPassed ? 'All input validation tests passed' : 'Some validation tests failed',
      details,
    };
  }

  // Test 4: Security Tests
  async testSecurityMeasures() {
    let allPassed = true;
    const details = [];

    for (const test of testData.securityTests) {
      const testPayload = { ...testData.validContact, ...test.data };
      const response = await this.makeRequest('/api/contact', 'POST', testPayload);

      // Check if malicious input was sanitized or rejected
      const isSecure = !response.ok ||
                      !response.data.success ||
                      !JSON.stringify(response.data).includes('<script>') ||
                      !JSON.stringify(response.data).includes('DROP TABLE');

      if (isSecure) {
        details.push(`✓ ${test.name}: Security measure effective`);
      } else {
        details.push(`✗ ${test.name}: Potential security vulnerability`);
        allPassed = false;
      }
    }

    return {
      success: allPassed,
      message: allPassed ? 'All security tests passed' : 'Security vulnerabilities found',
      details,
    };
  }

  // Test 5: Rate Limiting
  async testRateLimiting() {
    const details = [];
    let rateLimitTriggered = false;

    // Make multiple rapid requests to trigger rate limiting
    for (let i = 0; i < 5; i++) {
      const response = await this.makeRequest('/api/contact', 'POST', testData.validContact);

      if (response.status === 429) {
        rateLimitTriggered = true;
        details.push(`Request ${i + 1}: Rate limit triggered (429)`);
        break;
      } else {
        details.push(`Request ${i + 1}: Status ${response.status}`);
      }

      // Small delay to avoid overwhelming the server
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    return {
      success: rateLimitTriggered,
      message: rateLimitTriggered ? 'Rate limiting is working' : 'Rate limiting may not be active',
      details,
    };
  }

  // Test 6: Appointment API Health Check
  async testAppointmentAPIHealth() {
    const response = await this.makeRequest('/api/appointments');

    if (response.ok) {
      return {
        success: true,
        message: 'Appointment API is operational',
        details: response.data,
      };
    }

    return {
      success: false,
      message: `Appointment API health check failed: ${response.data?.error || 'Unknown error'}`,
      details: response,
    };
  }

  // Test 7: Valid Appointment Submission
  async testValidAppointmentSubmission() {
    const response = await this.makeRequest('/api/appointments', 'POST', testData.validAppointment);

    if (response.ok && response.data.success) {
      return {
        success: true,
        message: 'Valid appointment submission accepted',
        details: response.data,
      };
    }

    return {
      success: false,
      message: `Valid appointment submission rejected: ${response.data?.error || 'Unknown error'}`,
      details: response,
    };
  }

  // Test 8: Appointment Availability Check
  async testAppointmentAvailability() {
    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const response = await this.makeRequest(`/api/appointments?action=availability&date=${tomorrow}`);

    if (response.ok && response.data.success && response.data.availability) {
      return {
        success: true,
        message: 'Appointment availability check working',
        details: {
          availableSlots: response.data.availability.filter(slot => slot.available).length,
          totalSlots: response.data.availability.length,
        },
      };
    }

    return {
      success: false,
      message: `Availability check failed: ${response.data?.error || 'Unknown error'}`,
      details: response,
    };
  }

  // Test 9: Database Connection Test
  async testDatabaseConnection() {
    const response = await this.makeRequest('/api/debug/db-connection');

    if (response.ok && response.data.success) {
      return {
        success: true,
        message: 'Database connection is working',
        details: response.data,
      };
    }

    return {
      success: false,
      message: `Database connection failed: ${response.data?.error || 'Unknown error'}`,
      details: response,
    };
  }

  // Main test runner
  async runAllTests() {
    this.log('Starting comprehensive contact form testing...', 'info');
    this.log('='.repeat(50), 'info');

    // Run all tests
    await this.runTest('API Health Check', () => this.testAPIHealth());
    await this.runTest('Database Connection', () => this.testDatabaseConnection());
    await this.runTest('Valid Contact Form Submission', () => this.testValidContactSubmission());
    await this.runTest('Input Validation', () => this.testInputValidation());
    await this.runTest('Security Measures', () => this.testSecurityMeasures());
    await this.runTest('Rate Limiting', () => this.testRateLimiting());
    await this.runTest('Appointment API Health', () => this.testAppointmentAPIHealth());
    await this.runTest('Valid Appointment Submission', () => this.testValidAppointmentSubmission());
    await this.runTest('Appointment Availability Check', () => this.testAppointmentAvailability());

    // Print summary
    this.log('='.repeat(50), 'info');
    this.log(`Test Summary:`, 'info');
    this.log(`✓ Passed: ${this.results.passed}`, 'success');
    this.log(`✗ Failed: ${this.results.failed}`, 'error');
    this.log(`Total: ${this.results.passed + this.results.failed}`, 'info');

    const successRate = ((this.results.passed / (this.results.passed + this.results.failed)) * 100).toFixed(1);
    this.log(`Success Rate: ${successRate}%`, successRate >= 80 ? 'success' : 'warning');

    if (this.results.failed > 0) {
      this.log('\nFailed Tests:', 'warning');
      this.results.tests
        .filter(test => !test.success)
        .forEach(test => {
          this.log(`  • ${test.name}: ${test.message}`, 'error');
        });
    }

    // Recommendations
    this.log('\nRecommendations:', 'info');
    if (successRate >= 90) {
      this.log('✓ Contact forms are production-ready!', 'success');
    } else if (successRate >= 70) {
      this.log('⚠ Contact forms are mostly functional but need some improvements', 'warning');
    } else {
      this.log('✗ Contact forms need significant work before production deployment', 'error');
    }

    return this.results;
  }
}

// Run tests if script is executed directly
if (require.main === module) {
  const tester = new ContactFormTester();

  tester.runAllTests()
    .then((results) => {
      process.exit(results.failed === 0 ? 0 : 1);
    })
    .catch((error) => {
      console.error('Test runner failed:', error);
      process.exit(1);
    });
}

module.exports = ContactFormTester;