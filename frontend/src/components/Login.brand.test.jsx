import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import { IntlProvider } from "react-intl";
import { vi } from "vitest";
import messages from "../languages/en.json";
import UserSessionDetailsContext from "../UserSessionDetailsContext";

// Layout pulls in the whole app shell; only its contexts are needed here.
vi.mock("./layout/Layout", async () => {
  const contexts = await import("./layout/contexts");
  return {
    ConfigurationContext: contexts.ConfigurationContext,
    NotificationContext: contexts.NotificationContext,
  };
});

vi.mock("./utils/BrandingUtils", () => ({
  getBranding: vi.fn(),
}));

import Login from "./Login";
import { ConfigurationContext, NotificationContext } from "./layout/Layout";
import { getBranding } from "./utils/BrandingUtils";

const renderLogin = () =>
  render(
    <IntlProvider locale="en" messages={messages}>
      <UserSessionDetailsContext.Provider
        value={{
          userSessionDetails: { authenticated: false },
          refresh: vi.fn(),
        }}
      >
        <ConfigurationContext.Provider
          value={{ configurationProperties: { useFormLogin: "true" } }}
        >
          <NotificationContext.Provider
            value={{
              notificationVisible: false,
              addNotification: vi.fn(),
              setNotificationVisible: vi.fn(),
            }}
          >
            <Login />
          </NotificationContext.Provider>
        </ConfigurationContext.Provider>
      </UserSessionDetailsContext.Provider>
    </IntlProvider>,
  );

describe("Login brand", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  test("shows the icon and brand name when no custom login logo is configured", () => {
    getBranding.mockImplementation((callback) => callback({}));

    const { container } = renderLogin();

    expect(
      screen.getAllByText(messages["login.brand.name"]).length,
    ).toBeGreaterThan(0);
    const icons = container.querySelectorAll(".login-brand img");
    expect(icons.length).toBeGreaterThan(0);
    icons.forEach((icon) =>
      expect(icon.getAttribute("src")).toMatch(/images\/openelis_logo\.png$/),
    );
    expect(
      container.querySelector('img[src$="openelis_logo_full.png"]'),
    ).toBeNull();
  });

  test("shows the uploaded login logo instead of the brand name", () => {
    getBranding.mockImplementation((callback) =>
      callback({ loginLogoUrl: "/rest/site-branding/logo/login" }),
    );

    renderLogin();

    expect(
      screen.getAllByAltText("fullsize logo")[0].getAttribute("src"),
    ).toContain("/rest/site-branding/logo/login");
    expect(
      screen.queryByText(messages["login.brand.name"]),
    ).not.toBeInTheDocument();
  });

  test("does not show the access notice", () => {
    getBranding.mockImplementation((callback) => callback({}));

    renderLogin();

    expect(
      screen.queryByText(messages["login.notice.message"]),
    ).not.toBeInTheDocument();
  });

  test("falls back to the brand name when the uploaded logo fails to load", () => {
    getBranding.mockImplementation((callback) =>
      callback({ loginLogoUrl: "/rest/site-branding/logo/login" }),
    );

    renderLogin();
    screen
      .getAllByAltText("fullsize logo")
      .forEach((img) => fireEvent.error(img));

    expect(
      screen.getAllByText(messages["login.brand.name"]).length,
    ).toBeGreaterThan(0);
  });
});
