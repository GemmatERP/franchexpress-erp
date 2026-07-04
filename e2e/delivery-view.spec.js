const { test, expect } = require('@playwright/test');

// Robust helper to log in a user and handle cookie setting race conditions
async function login(page, email, password) {
  await page.goto('/login');
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', password);
  await page.click('button[type="submit"]');
  
  try {
    // Wait for redirection to dashboard (allow extra time for page hot compilation in dev environment)
    await page.waitForURL(url => url.pathname.startsWith('/dashboard'), { timeout: 25000 });
  } catch (e) {
    // Handle transient redirection race condition by waiting and navigating to redirect URL directly
    if (page.url().includes('redirect=')) {
      await page.waitForTimeout(1500);
      const redirectUrl = new URL(page.url()).searchParams.get('redirect') || '/dashboard';
      await page.goto(redirectUrl);
      await page.waitForURL(url => url.pathname.startsWith('/dashboard'), { timeout: 25000 });
    } else {
      throw e;
    }
  }
}

test.describe('Delivery View - Access Control', () => {
  test('Admin should see Delivery View menu item and access the page', async ({ page }) => {
    await login(page, 'admin@fe.com', 'Admin@123');
    // Sidebar menu item should be visible
    const menuLink = page.locator('aside a[href="/dashboard/delivery"]');
    await expect(menuLink).toBeVisible();
    await menuLink.click();
    await page.waitForURL('**/dashboard/delivery');
    await expect(page.locator('#main-content h1:has-text("Delivery View")')).toBeVisible();
  });

  test('Employee should see Delivery View menu item and access the page', async ({ page }) => {
    await login(page, 'support@gemmat.net', 'Emp@123');
    // Sidebar menu item should be visible
    const menuLink = page.locator('aside a[href="/dashboard/delivery"]');
    await expect(menuLink).toBeVisible();
    await menuLink.click();
    await page.waitForURL('**/dashboard/delivery');
    await expect(page.locator('#main-content h1:has-text("Delivery View")')).toBeVisible();
  });

  test('Delivery Agent should NOT see Delivery View menu item and direct URL access should be blocked', async ({ page }) => {
    await login(page, 'deliverytest@fe.com', 'Delivery@123');
    // Sidebar menu item should NOT be visible
    const menuLink = page.locator('aside a[href="/dashboard/delivery"]');
    await expect(menuLink).not.toBeVisible();

    // Direct access via URL manipulation should redirect back to their own workspace
    await page.goto('/dashboard/delivery');
    await page.waitForURL('**/dashboard/delivery-agent');
    await expect(page.locator('h2:has-text("Bulk AWB Scan & Deliver")')).toBeVisible();
  });

  test('Direct URL access to /dashboard/delivery without auth should redirect to login', async ({ page }) => {
    await page.goto('/dashboard/delivery');
    await page.waitForURL(url => url.pathname === '/login');
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });
});

test.describe('Delivery View - Functionality & Drill-in', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, 'admin@fe.com', 'Admin@123');
    await page.goto('/dashboard/delivery');
  });

  test('Should list agents and show all 5 metrics plus actions', async ({ page }) => {
    // Wait for the table rows to load
    await page.waitForSelector('[data-agent-row]');
    
    // Check table headers using strict column headers
    await expect(page.getByRole('columnheader', { name: 'Agent Name' }).first()).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Delivered', exact: true }).first()).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Not Delivered', exact: true }).first()).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Earned Today' }).first()).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'To Be Paid' }).first()).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Pending Previous' }).first()).toBeVisible();

    // Verify at least one row exists
    const rows = page.locator('[data-agent-row]');
    const count = await rows.count();
    expect(count).toBeGreaterThan(0);
  });

  test('Searching agent by name should filter list', async ({ page }) => {
    await page.waitForSelector('[data-agent-row]');
    const searchInput = page.locator('#agent-search-input');
    await searchInput.fill('NonExistentAgentName');
    
    // Empty state should display
    await expect(page.locator('h3:has-text("No agents found")')).toBeVisible();

    // Clear search
    await searchInput.fill('');
    await expect(page.locator('[data-agent-row]').first()).toBeVisible();
  });

  test('Clicking right-arrow should open agent dashboard and show date range filter', async ({ page }) => {
    await page.waitForSelector('[data-agent-row]');
    
    // Drill down on first agent
    const firstRow = page.locator('[data-agent-row]').first();
    const agentName = await firstRow.locator('p.font-bold').first().textContent();
    
    const drillBtn = firstRow.locator('[data-drill-in-btn]');
    await drillBtn.click();
    
    // Verify drill-in title loads
    await expect(page.locator('#main-content h1:has-text("Agent Dashboard:")')).toContainText(agentName);
    
    // Verify performance and history panels
    await expect(page.locator('h2:has-text("Performance & Handovers")')).toBeVisible();
    await expect(page.locator('span:has-text("Delivery History")')).toBeVisible();

    // Verify Date Filters exist
    const fromInput = page.locator('label:has-text("From") + input[type="date"]');
    const toInput = page.locator('label:has-text("To") + input[type="date"]');
    await expect(fromInput).toBeVisible();
    await expect(toInput).toBeVisible();

    // Test back button
    const backBtn = page.locator('#back-to-list-btn');
    await backBtn.click();
    
    // Verify return to list
    await expect(page.locator('#main-content h1:has-text("Delivery View")')).toBeVisible();
    await expect(page.locator('[data-agent-row]').first()).toBeVisible();
  });

  test('Clicking rapidly or double-click does not break state', async ({ page }) => {
    await page.waitForSelector('[data-agent-row]');
    const firstRow = page.locator('[data-agent-row]').first();
    const drillBtn = firstRow.locator('[data-drill-in-btn]');
    
    // Double click
    await drillBtn.dblclick();
    
    // Verify it still loads correctly
    await expect(page.locator('h2:has-text("Performance & Handovers")')).toBeVisible();
  });
});

test.describe('Delivery View - Mocked Edge Cases', () => {
  test('Zero delivery agents displays empty state gracefully', async ({ page }) => {
    await page.route('**/api/delivery-agents', route => route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ agents: [], total: 0 }),
    }));

    await login(page, 'admin@fe.com', 'Admin@123');
    await page.goto('/dashboard/delivery');

    await expect(page.locator('h3:has-text("No agents found")')).toBeVisible();
  });

  test('Zero metrics are rendered correctly (not NaN or blank)', async ({ page }) => {
    await page.route('**/api/delivery-agents', route => route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        agents: [{
          uid: 'zero-agent-123',
          name: 'Zero Delivery Agent',
          email: 'zero@fe.com',
          deliveredCount: 0,
          notDeliveredCount: 0,
          earnedToday: 0,
          toBePaidToday: 0,
          pendingPrevious: 0
        }],
        total: 1
      }),
    }));

    await login(page, 'admin@fe.com', 'Admin@123');
    await page.goto('/dashboard/delivery');

    const agentRow = page.locator('[data-agent-row="zero-agent-123"]').first();
    await expect(agentRow).toBeVisible();
    await expect(agentRow.locator('td:nth-child(2)')).toContainText('0');
    await expect(agentRow.locator('td:nth-child(3)')).toContainText('0');
    await expect(agentRow.locator('td:nth-child(4)')).toContainText('₹0');
    await expect(agentRow.locator('td:nth-child(5)')).toContainText('₹0');
    await expect(agentRow.locator('td:nth-child(6)')).toContainText('₹0');
  });

  test('Network API failure shows error state', async ({ page }) => {
    await page.route('**/api/delivery-agents', route => route.abort());

    await login(page, 'admin@fe.com', 'Admin@123');
    await page.goto('/dashboard/delivery');

    await expect(page.locator('h3:has-text("Failed to load Agents")')).toBeVisible();
  });
});

test.describe('Delivery View - Pay Button & Expense Modal Integration', () => {
  const mockAgent = {
    uid: 'agent-pay-test-uid',
    name: 'Paying Agent Test',
    email: 'paytest@fe.com',
    deliveredCount: 2,
    notDeliveredCount: 0,
    earnedToday: 40,
    toBePaidToday: 40,
    pendingPrevious: 20
  };

  const mockZeroAgent = {
    uid: 'agent-zero-due-uid',
    name: 'Zero Dues Agent',
    email: 'zerodues@fe.com',
    deliveredCount: 0,
    notDeliveredCount: 0,
    earnedToday: 0,
    toBePaidToday: 0,
    pendingPrevious: 0
  };

  test('Pay button is displayed for agents with dues and hidden for zero dues', async ({ page }) => {
    await page.route('**/api/delivery-agents', route => route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        agents: [mockAgent, mockZeroAgent],
        total: 2
      }),
    }));

    await login(page, 'admin@fe.com', 'Admin@123');
    await page.goto('/dashboard/delivery');

    // Pay button should be visible for mockAgent
    await expect(page.locator(`[data-pay-btn="${mockAgent.uid}"]`).first()).toBeVisible();

    // Pay button should NOT be visible for mockZeroAgent
    await expect(page.locator(`[data-pay-btn="${mockZeroAgent.uid}"]`)).not.toBeVisible();
  });

  test('Clicking Pay opens modal, pre-fills fields correctly, and successful save resets dues', async ({ page }) => {
    let apiCalled = false;
    let savedPayload = null;

    // Route agent list
    await page.route('**/api/delivery-agents', async (route) => {
      // Return dues = 0 if payment already submitted, otherwise return original mockAgent
      if (apiCalled) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            agents: [{ ...mockAgent, toBePaidToday: 0, pendingPrevious: 0 }],
            total: 1
          })
        });
      } else {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            agents: [mockAgent],
            total: 1
          })
        });
      }
    });

    // Intercept POST /api/expenses
    await page.route('**/api/expenses', route => {
      if (route.request().method() === 'POST') {
        apiCalled = true;
        savedPayload = route.request().postDataJSON();
        route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({ id: 'exp-doc-123', success: true }),
        });
      } else {
        route.fallback();
      }
    });

    await login(page, 'admin@fe.com', 'Admin@123');
    await page.goto('/dashboard/delivery');

    // Click Pay
    await page.locator(`[data-pay-btn="${mockAgent.uid}"]`).first().click();

    // Verify modal is open and pre-filled
    const modal = page.locator('h3:has-text("Add Transaction")');
    await expect(modal).toBeVisible();

    const amtInput = page.locator('label:has-text("Amount (₹)") + input');
    await expect(amtInput).toHaveValue('60'); // 40 + 20

    const partInput = page.locator('label:has-text("Particulars / Description") + input');
    await expect(partInput).toHaveValue(new RegExp(`^Delivery payment - Paying Agent Test - \\d{4}-\\d{2}-\\d{2}$`));

    // Submit
    await page.locator('button[type="submit"]:has-text("Record Transaction")').click();

    // Verify modal closes
    await expect(modal).not.toBeVisible();

    // Verify payload sent
    expect(savedPayload).not.toBeNull();
    expect(savedPayload.amount).toBe(60);
    expect(savedPayload.agentUid).toBe(mockAgent.uid);
    expect(savedPayload.isDeliveryPayment).toBe(true);

    // Verify dues are reset to 0 in the table row
    const row = page.locator(`[data-agent-row="${mockAgent.uid}"]`).first();
    await expect(row.locator('td:nth-child(5)')).toContainText('₹0');
    await expect(row.locator('td:nth-child(6)')).toContainText('₹0');
  });

  test('Failing save does not close modal or reset dues, and cancel modal has no side effects', async ({ page }) => {
    // Return mockAgent with dues
    await page.route('**/api/delivery-agents', route => route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ agents: [mockAgent], total: 1 }),
    }));

    // Intercept POST /api/expenses and simulate network failure
    await page.route('**/api/expenses', route => {
      if (route.request().method() === 'POST') {
        route.abort();
      } else {
        route.fallback();
      }
    });

    await login(page, 'admin@fe.com', 'Admin@123');
    await page.goto('/dashboard/delivery');

    // Click Pay
    await page.locator(`[data-pay-btn="${mockAgent.uid}"]`).first().click();

    // Record Transaction
    await page.locator('button[type="submit"]:has-text("Record Transaction")').click();

    // Modal should stay open
    await expect(page.locator('h3:has-text("Add Transaction")')).toBeVisible();

    // Cancel modal
    await page.locator('button:has-text("Cancel")').click();
    await expect(page.locator('h3:has-text("Add Transaction")')).not.toBeVisible();

    // Verify dues are still visible and unmodified
    const row = page.locator(`[data-agent-row="${mockAgent.uid}"]`).first();
    await expect(row.locator('td:nth-child(5)')).toContainText('₹40');
    await expect(row.locator('td:nth-child(6)')).toContainText('₹20');
  });

  test('Delivery Agent role cannot access the expense API directly (returns 403)', async ({ page }) => {
    await login(page, 'deliverytest@fe.com', 'Delivery@123');

    // Try to trigger expense POST via page.evaluate
    const status = await page.evaluate(async () => {
      // Retrieve fe_token cookie
      const getCookie = (name) => {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) return parts.pop().split(';').shift();
      };
      const token = getCookie('fe_token');
      
      const res = await fetch('/api/expenses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          date: new Date().toISOString(),
          particulars: 'Unauthorized hack payment',
          amount: 100,
          agentUid: 'some-agent-id',
          isDeliveryPayment: true
        })
      });
      return res.status;
    });

    expect(status).toBe(403);
  });

  test('Clicking Pay inside agent dashboard opens modal prefilled', async ({ page }) => {
    await page.route('**/api/delivery-agents', route => route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ agents: [mockAgent], total: 1 }),
    }));

    // Mock active queue endpoint to return completed items matching toBePaidToday = 40
    await page.route('**/api/delivery-queue*', route => route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        items: [
          { status: 'completed', compDateStr: new Date().toISOString().slice(0, 10) },
          { status: 'completed', compDateStr: new Date().toISOString().slice(0, 10) }
        ]
      }),
    }));

    await login(page, 'admin@fe.com', 'Admin@123');
    await page.goto('/dashboard/delivery');

    // Drill down
    await page.locator('[data-drill-in-btn]').first().click();

    // Verify drill-down is loaded and click Pay inside dashboard card
    await page.locator('#dashboard-pay-btn').click();

    // Verify modal is open and prefilled with sum amount
    const modal = page.locator('h3:has-text("Add Transaction")');
    await expect(modal).toBeVisible();

    const amtInput = page.locator('label:has-text("Amount (₹)") + input');
    await expect(amtInput).toHaveValue('60'); // 40 + 20
  });
});
