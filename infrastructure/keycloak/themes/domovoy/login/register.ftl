<#import "template.ftl" as layout>

<#import "user-profile-commons.ftl" as userProfileCommons>

<@layout.registrationLayout displayMessage=messagesPerField.exists('global') displayInfo=false displayRequiredFields=true; section>

    <#if section = "header">
        ${msg("registerTitle")}
    <div class="kc-form-nav">
        <a class="kc-back-link" href="${url.loginUrl}">${msg("backToLogin")}</a>
    </div>
    <#elseif section = "form">
        <form id="kc-register-form" class="kc-form" action="${url.registrationAction}" method="post">
            <@userProfileCommons.userProfileFormFields; callback, attribute>
                <#if callback = "afterField">
                    <#if passwordRequired?? && (attribute.name == "username" || (attribute.name == "email" && realm.registrationEmailAsUsername))>
                        <div class="kc-field">
                            <div class="kc-label-wrap">
                                <label for="password" class="kc-label">${msg("password")}</label>
                                <span class="required">*</span>
                            </div>
                            <div class="kc-input-group" dir="ltr">
                                <input
                                    type="password"
                                    id="password"
                                    class="kc-input"
                                    name="password"
                                    autocomplete="new-password"
                                    placeholder="${msg('domovoyPasswordPlaceholder')}"
                                    aria-invalid="<#if messagesPerField.existsError('password','password-confirm')>true<#else>false</#if>"
                                />
                                <button
                                    class="kc-toggle-password"
                                    type="button"
                                    aria-label="${msg('showPassword')}"
                                    aria-controls="password"
                                    data-password-toggle
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
                            <#if messagesPerField.existsError('password')>
                                <span id="input-error-password" class="kc-field-error" aria-live="polite">
                                    ${kcSanitize(messagesPerField.get('password'))?no_esc}
                                </span>
                            </#if>
                        </div>
                        <div class="kc-field">
                            <div class="kc-label-wrap">
                                <label for="password-confirm" class="kc-label">${msg("passwordConfirm")}</label>
                                <span class="required">*</span>
                            </div>
                            <div class="kc-input-group" dir="ltr">
                                <input
                                    type="password"
                                    id="password-confirm"
                                    class="kc-input"
                                    name="password-confirm"
                                    autocomplete="new-password"
                                    placeholder="${msg('domovoyPasswordConfirmPlaceholder')}"
                                    aria-invalid="<#if messagesPerField.existsError('password-confirm')>true<#else>false</#if>"
                                />
                                <button
                                    class="kc-toggle-password"
                                    type="button"
                                    aria-label="${msg('showPassword')}"
                                    aria-controls="password-confirm"
                                    data-password-toggle
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
                            <#if messagesPerField.existsError('password-confirm')>
                                <span id="input-error-password-confirm" class="kc-field-error" aria-live="polite">
                                    ${kcSanitize(messagesPerField.get('password-confirm'))?no_esc}
                                </span>
                            </#if>
                        </div>
                    </#if>
                </#if>
            </@userProfileCommons.userProfileFormFields>

            <#if termsAcceptanceRequired??>
                <div class="kc-field">
                    <div class="kc-terms-text">
                        ${msg("termsTitle")}
                        <div id="kc-registration-terms-text">
                            ${kcSanitize(msg("termsText"))?no_esc}
                        </div>
                    </div>
                    <label class="kc-checkbox" for="termsAccepted">
                        <input
                            type="checkbox"
                            id="termsAccepted"
                            name="termsAccepted"
                            aria-invalid="<#if messagesPerField.existsError('termsAccepted')>true<#else>false</#if>"
                        />
                        <span>${msg("acceptTerms")}</span>
                    </label>
                    <#if messagesPerField.existsError('termsAccepted')>
                        <span id="input-error-terms-accepted" class="kc-field-error" aria-live="polite">
                            ${kcSanitize(messagesPerField.get('termsAccepted'))?no_esc}
                        </span>
                    </#if>
                </div>
            </#if>

            <#if recaptchaRequired?? && (recaptchaVisible!false)>
                <div class="kc-field">
                    <div class="kc-input-wrap">
                        <div class="g-recaptcha" data-size="compact" data-sitekey="${recaptchaSiteKey}" data-action="${recaptchaAction}"></div>
                    </div>
                </div>
            </#if>



            <#if recaptchaRequired?? && !(recaptchaVisible!false)>
                <script>
                    function onSubmitRecaptcha(token) {
                        document.getElementById("kc-register-form").requestSubmit();
                    }
                </script>
                <div class="kc-form-buttons">
                    <button
                        class="kc-submit g-recaptcha"
                        data-sitekey="${recaptchaSiteKey}"
                        data-callback="onSubmitRecaptcha"
                        data-action="${recaptchaAction}"
                        type="submit"
                    >
                        <span class="kc-submit-label">${msg("doRegister")}</span>
                    </button>
                </div>
            <#else>
                <div class="kc-form-buttons">
                    <button class="kc-submit" type="submit">
                        <span class="kc-submit-label">${msg("doRegister")}</span>
                    </button>
                </div>

            </#if>



            <p class="kc-consent-text">

                ${kcSanitize(msg("domovoyRegistrationConsent"))?no_esc}

            </p>

        </form>

    </#if>
</@layout.registrationLayout>
