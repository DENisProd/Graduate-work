<#import "template.ftl" as layout>
<#import "passkeys.ftl" as passkeys>
<@layout.registrationLayout displayMessage=!messagesPerField.existsError('username','password') displayInfo=realm.password && realm.registrationAllowed && !registrationDisabled??; section>
    <#if section = "header">
        ${msg("loginAccountTitle")}
    <#elseif section = "form">
        <#if realm.password>
            <form id="kc-form-login" class="kc-form" onsubmit="login.disabled = true; return true;" action="${url.loginAction}" method="post">
                <#if !usernameHidden??>
                    <div class="kc-field">
                        <div class="kc-label-row">
                            <label for="username" class="kc-label">
                                <#if !realm.loginWithEmailAllowed>
                                    ${msg("username")}
                                <#elseif !realm.registrationEmailAsUsername>
                                    ${msg("usernameOrEmail")}
                                <#else>
                                    ${msg("email")}
                                </#if>
                            </label>
                        </div>
                        <div class="kc-input-wrap">
                            <input
                                tabindex="2"
                                id="username"
                                class="kc-input"
                                name="username"
                                value="${(login.username!'')}"
                                type="text"
                                placeholder="<#if !realm.loginWithEmailAllowed>${msg('domovoyUsernamePlaceholder')}<#elseif !realm.registrationEmailAsUsername>${msg('domovoyUsernameOrEmailPlaceholder')}<#else>${msg('domovoyEmailPlaceholder')}</#if>"
                                autofocus
                                autocomplete="${(enableWebAuthnConditionalUI?has_content)?then('username webauthn', 'username')}"
                                aria-invalid="<#if messagesPerField.existsError('username','password')>true<#else>false</#if>"
                                dir="ltr"
                            />
                        </div>
                        <#if messagesPerField.existsError('username','password')>
                            <span id="input-error" class="kc-field-error" aria-live="polite">
                                ${kcSanitize(messagesPerField.getFirstError('username','password'))?no_esc}
                            </span>
                        </#if>
                    </div>
                </#if>

                <div class="kc-field">
                    <div class="kc-label-row">
                        <label for="password" class="kc-label">${msg("password")}</label>
                        <#if realm.resetPasswordAllowed>
                            <a tabindex="6" class="kc-help-link" href="${url.loginResetCredentialsUrl}">
                                ${msg("doForgotPassword")}
                            </a>
                        </#if>
                    </div>
                    <div class="kc-input-group" dir="ltr">
                        <input
                            tabindex="3"
                            id="password"
                            class="kc-input"
                            name="password"
                            type="password"
                            placeholder="${msg('domovoyPasswordPlaceholder')}"
                            autocomplete="current-password"
                            aria-invalid="<#if messagesPerField.existsError('username','password')>true<#else>false</#if>"
                        />
                        <button
                            class="kc-toggle-password"
                            type="button"
                            aria-label="${msg("showPassword")}"
                            aria-controls="password"
                            data-password-toggle
                            tabindex="4"
                            data-label-show="${msg('showPassword')}"
                            data-label-hide="${msg('hidePassword')}"
                        >
                            <span class="kc-toggle-password-text sr-only">${msg("showPassword")}</span>
                            <span class="kc-toggle-password-icon kc-toggle-password-icon-show" aria-hidden="true">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                                    <path d="M2 12s3.6-6 10-6 10 6 10 6-3.6 6-10 6S2 12 2 12Z" />
                                    <circle cx="12" cy="12" r="3" />
                                </svg>
                            </span>
                            <span class="kc-toggle-password-icon kc-toggle-password-icon-hide" aria-hidden="true">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                                    <path d="M3 3l18 18" />
                                    <path d="M10.6 10.7A3 3 0 0 0 12 15a3 3 0 0 0 2.3-.9" />
                                    <path d="M9.4 5.2A11 11 0 0 1 12 5c6.4 0 10 7 10 7a18.7 18.7 0 0 1-3.2 4.2" />
                                    <path d="M6.2 6.3A18.3 18.3 0 0 0 2 12s3.6 7 10 7a10.7 10.7 0 0 0 4-.8" />
                                </svg>
                            </span>
                        </button>
                    </div>
                    <#if usernameHidden?? && messagesPerField.existsError('username','password')>
                        <span id="input-error" class="kc-field-error" aria-live="polite">
                            ${kcSanitize(messagesPerField.getFirstError('username','password'))?no_esc}
                        </span>
                    </#if>
                </div>

                <div class="kc-options">
                    <#if realm.rememberMe && !usernameHidden??>
                        <label class="kc-checkbox" for="rememberMe">
                            <#if login.rememberMe??>
                                <input tabindex="5" id="rememberMe" name="rememberMe" type="checkbox" checked />
                            <#else>
                                <input tabindex="5" id="rememberMe" name="rememberMe" type="checkbox" />
                            </#if>
                            <span>${msg("rememberMe")}</span>
                        </label>
                    </#if>
                </div>

                <div>
                    <input type="hidden" id="id-hidden-input" name="credentialId" <#if auth.selectedCredential?has_content>value="${auth.selectedCredential}"</#if>/>
                    <button tabindex="7" class="kc-submit" name="login" id="kc-login" type="submit">
                        <span class="kc-submit-label">${msg("doLogIn")}</span>
                    </button>
                </div>
            </form>
        </#if>
        <@passkeys.conditionalUIData />
    <#elseif section = "info">
        <#if realm.password && realm.registrationAllowed && !registrationDisabled??>
            <span>
                ${msg("noAccount")}
                <a tabindex="8" href="${url.registrationUrl}">${msg("doRegister")}</a>
            </span>
        </#if>
    <#elseif section = "socialProviders">
        <#if realm.password && social?? && social.providers?has_content>
            <div class="kc-social" id="kc-social-providers">
                <h2 class="kc-social-title">${msg("identity-provider-login-label")}</h2>
                <div class="kc-social-list">
                    <#list social.providers as p>
                        <a
                            data-once-link
                            data-disabled-class="kc-social-link"
                            id="social-${p.alias}"
                            class="kc-social-link"
                            type="button"
                            href="${p.loginUrl}"
                        >
                            <#if p.iconClasses?has_content>
                                <i class="${p.iconClasses!}" aria-hidden="true"></i>
                            </#if>
                            <span class="kc-social-name">${p.displayName!}</span>
                        </a>
                    </#list>
                </div>
            </div>
        </#if>
    </#if>
</@layout.registrationLayout>
