<#import "footer.ftl" as loginFooter>
<#macro registrationLayout bodyClass="" displayInfo=false displayMessage=true displayRequiredFields=false>
<!DOCTYPE html>
<html lang="${lang}"<#if realm.internationalizationEnabled> dir="${(locale.rtl)?then('rtl','ltr')}"</#if>>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
    <#if properties.meta?has_content>
        <#list properties.meta?split(' ') as meta>
            <meta name="${meta?split('==')[0]}" content="${meta?split('==')[1]}"/>
        </#list>
    </#if>
    <title>${title!}</title>
    <link rel="icon" href="${url.resourcesPath}/img/logo.svg" />
    <#if properties.stylesCommon?has_content>
        <#list properties.stylesCommon?split(' ') as style>
            <link href="${url.resourcesCommonPath}/${style}" rel="stylesheet" />
        </#list>
    </#if>
    <#if properties.styles?has_content>
        <#list properties.styles?split(' ') as style>
            <link href="${url.resourcesPath}/${style}" rel="stylesheet" />
        </#list>
    </#if>
    <#if properties.scripts?has_content>
        <#list properties.scripts?split(' ') as script>
            <script src="${url.resourcesPath}/${script}" type="text/javascript"></script>
        </#list>
    </#if>
    <script>
        (function() {
            try {
                var storedTheme = window.localStorage.getItem("domovoy-kc-theme");
                var resolvedTheme = storedTheme;

                if (resolvedTheme !== "light" && resolvedTheme !== "dark") {
                    resolvedTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
                }

                document.documentElement.setAttribute("data-kc-theme", resolvedTheme);
                document.documentElement.style.colorScheme = resolvedTheme;
            } catch (error) {
                document.documentElement.setAttribute("data-kc-theme", "light");
                document.documentElement.style.colorScheme = "light";
            }
        })();
    </script>
    <script type="importmap">
        {
            "imports": {
                "rfc4648": "${url.resourcesCommonPath}/vendor/rfc4648/rfc4648.js"
            }
        }
    </script>
    <script src="${url.resourcesPath}/js/menu-button-links.js" type="module"></script>
    <#if scripts??>
        <#list scripts as script>
            <script src="${script}" type="text/javascript"></script>
        </#list>
    </#if>
    <script type="module">
        <#outputformat "JavaScript">
        import { startSessionPolling } from ${(url.resourcesPath + "/js/authChecker.js")?c};
        startSessionPolling(
            ${url.ssoLoginInOtherTabsUrl?c}
        );
        </#outputformat>
    </script>
    <#if authenticationSession??>
        <script type="module">
            <#outputformat "JavaScript">
            import { checkAuthSession } from ${(url.resourcesPath + "/js/authChecker.js")?c};
            checkAuthSession(
                ${authenticationSession.authSessionIdHash?c}
            );
            </#outputformat>
        </script>
    </#if>
</head>
<body class="${bodyClass}">
    <div class="kc-page" data-page-id="login-${pageId}">
        <div class="kc-shell">
            <main class="kc-auth-panel">
                <div class="kc-auth-layout">
                    <div class="kc-auth-topbar">
                        <div class="kc-auth-brandline">
                            <a class="kc-wordmark" href="https://home.darksecrets.ru">
                                <span class="kc-wordmark-icon">
                                    <img src="${url.resourcesPath}/img/logo.svg" alt="" />
                                </span>
                                <span class="kc-wordmark-text">Домовой</span>
                            </a>
                        </div>
                        <div class="kc-header-actions">
                            <#if realm.internationalizationEnabled && locale.supported?size gt 1>
                                <div class="kc-locale" id="kc-locale">
                                    <div id="kc-locale-wrapper">
                                        <div id="kc-locale-dropdown" class="menu-button-links">
                                            <button
                                                class="kc-locale-current"
                                                tabindex="1"
                                                id="kc-current-locale-link"
                                                aria-label="${msg("languages")}"
                                                aria-haspopup="true"
                                                aria-expanded="false"
                                                aria-controls="language-switch1"
                                            >
                                                ${locale.current}
                                            </button>
                                            <ul role="menu" tabindex="-1" aria-labelledby="kc-current-locale-link" id="language-switch1">
                                                <#assign i = 1>
                                                <#list locale.supported as l>
                                                    <li role="none">
                                                        <a role="menuitem" id="language-${i}" class="kc-locale-item" href="${l.url}">${l.label}</a>
                                                    </li>
                                                    <#assign i++>
                                                </#list>
                                            </ul>
                                        </div>
                                    </div>
                                </div>
                            </#if>
                            <button
                                type="button"
                                class="kc-theme-switch"
                                id="kc-theme-switch"
                                role="switch"
                                aria-label="${msg("domovoyThemeToggle")}"
                                aria-checked="false"
                                data-kc-theme-toggle
                                data-label-light="${msg("domovoyThemeLight")}"
                                data-label-dark="${msg("domovoyThemeDark")}"
                            >
                                <span class="sr-only">${msg("domovoyThemeToggle")}</span>
                                <span class="kc-theme-switch-icon kc-theme-switch-icon-light" aria-hidden="true">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                                        <circle cx="12" cy="12" r="4.5" />
                                        <path d="M12 2.5v2.2M12 19.3v2.2M4.7 4.7l1.6 1.6M17.7 17.7l1.6 1.6M2.5 12h2.2M19.3 12h2.2M4.7 19.3l1.6-1.6M17.7 6.3l1.6-1.6" />
                                    </svg>
                                </span>
                                <span class="kc-theme-switch-thumb" aria-hidden="true"></span>
                                <span class="kc-theme-switch-icon kc-theme-switch-icon-dark" aria-hidden="true">
                                    <svg viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M20.2 14.1A8.5 8.5 0 0 1 9.9 3.8a.7.7 0 0 0-.8-.9A10 10 0 1 0 21.1 14a.7.7 0 0 0-.9-.8Z" />
                                    </svg>
                                </span>
                            </button>
                        </div>
                    </div>
                    <div class="kc-auth-card-wrap">
                    <div class="kc-auth-card">
                        <div class="kc-auth-header">
                            <div>
                                <h1 class="kc-auth-title">
                                    <#if !(auth?has_content && auth.showUsername() && !auth.showResetCredentials())>
                                        <#nested "header">
                                    <#else>
                                        ${msg("loginAccountTitle")}
                                    </#if>
                                </h1>
                                <p class="kc-auth-subtitle">
                                    ${msg("domovoyAuthSubtitle")}
                                </p>
                                <#if auth?has_content && auth.showUsername() && !auth.showResetCredentials()>
                                    <#nested "show-username">
                                    <div class="kc-auth-user">
                                        <strong>${auth.attemptedUsername}</strong>
                                        <a class="kc-restart-link" id="reset-login" href="${url.loginRestartFlowUrl}">
                                            ${msg("restartLoginTooltip")}
                                        </a>
                                    </div>
                                </#if>
                            </div>
                        </div>

                        <#if displayMessage && message?has_content && (message.type != "warning" || !isAppInitiatedAction??)>
                            <div class="kc-message kc-message-${message.type}">
                                ${kcSanitize(message.summary)?no_esc}
                            </div>
                        </#if>

                        <#nested "form">

                        <#if auth?has_content && auth.showTryAnotherWayLink()>
                            <div class="kc-alt-actions">
                                <form id="kc-select-try-another-way-form" action="${url.loginAction}" method="post">
                                    <input type="hidden" name="tryAnotherWay" value="on"/>
                                    <a
                                        class="kc-alt-link"
                                        href="#"
                                        id="try-another-way"
                                        onclick="document.forms['kc-select-try-another-way-form'].requestSubmit();return false;"
                                    >
                                        ${msg("doTryAnotherWay")}
                                    </a>
                                </form>
                            </div>
                        </#if>

                        <#if switchOrganizationEnabled?? && switchOrganizationEnabled>
                            <div class="kc-alt-actions">
                                <form id="kc-switch-organization-form" action="${url.loginAction}" method="post">
                                    <input type="hidden" name="switchOrganization" value="true"/>
                                    <a
                                        class="kc-alt-link"
                                        href="#"
                                        id="switch-organization"
                                        onclick="document.forms['kc-switch-organization-form'].requestSubmit();return false;"
                                    >
                                        ${msg("doSwitchOrganization")}
                                    </a>
                                </form>
                            </div>
                        </#if>

                        <#nested "socialProviders">

                        <#if displayInfo>
                            <div class="kc-info" id="kc-info">
                                <#nested "info">
                            </div>
                        </#if>
                    </div>
                    </div>

                    <div class="kc-auth-support">
                        <span>${msg("domovoySupportText")}</span>
                        <a href="mailto:${msg("domovoySupportEmail")}">${msg("domovoySupportEmail")}</a>
                    </div>

                    <@loginFooter.content/>
                </div>
            </main>
            <aside class="kc-visual-panel" aria-hidden="true">
                <div class="kc-visual-stage">
                    <div class="kc-visual-art"></div>
                    <div class="kc-visual-card">
                        <div class="kc-visual-card-logo">
                            <img src="${url.resourcesPath}/img/logo.svg" alt="" />
                        </div>
                        <p class="kc-visual-card-kicker">${msg("domovoyVisualKicker")}</p>
                        <h2 class="kc-visual-card-title">${msg("domovoyVisualTitle")}</h2>
                        <p class="kc-visual-card-text">${msg("domovoyVisualText")}</p>
                    </div>
                </div>
            </aside>
        </div>
    </div>
</body>
</html>
</#macro>
