<#macro group name label error="" required=false>
<div class="${properties.kcFormGroupClass!}">
    <div class="${properties.kcFormGroupLabelClass!}">
        <label for="${name}" class="${properties.kcFormLabelClass!}">
            ${label}
            <#if required>
                <span class="${properties.kcInputRequiredClass!}">*</span>
            </#if>
        </label>
    </div>

    <#nested>

    <#if error?has_content>
        <span id="input-error-${name}" class="${properties.kcInputErrorMessageClass!}" aria-live="polite">
            ${error}
        </span>
    </#if>
</div>
</#macro>

<#macro input name label value="" required=false autocomplete="off" fieldName=name error=messagesPerField.get(fieldName) autofocus=false>
    <@group name=name label=label error=error required=required>
        <div class="${properties.kcInputWrapperClass!}">
            <input
                id="${name}"
                name="${name}"
                value="${value}"
                type="text"
                class="${properties.kcInputClass!}"
                autocomplete="${autocomplete}"
                <#if autofocus>autofocus</#if>
                <#if autocomplete == "one-time-code">inputmode="numeric"</#if>
                aria-invalid="<#if error?has_content>true<#else>false</#if>"
            />
        </div>
    </@group>
</#macro>

<#macro password name label value="" required=false forgotPassword=false fieldName=name error=messagesPerField.get(fieldName) autocomplete="off" autofocus=false>
    <@group name=name label=label error=error required=required>
        <div class="${properties.kcInputGroup!}" dir="ltr">
            <input
                id="${name}"
                name="${name}"
                value="${value}"
                type="password"
                class="${properties.kcInputClass!}"
                autocomplete="${autocomplete}"
                <#if autofocus>autofocus</#if>
                aria-invalid="<#if error?has_content>true<#else>false</#if>"
            />
            <button
                class="kc-toggle-password"
                type="button"
                aria-label="${msg('showPassword')}"
                aria-controls="${name}"
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
        <#nested>
        <#if forgotPassword>
            <a class="kc-help-link" href="${url.loginResetCredentialsUrl}">${msg("doForgotPassword")}</a>
        </#if>
    </@group>
</#macro>

<#macro checkbox name label value=false required=false>
    <label class="${properties.kcCheckboxClass!}" for="${name}">
        <input
            type="checkbox"
            id="${name}"
            name="${name}"
            <#if value>checked</#if>
        />
        <span>${label}</span>
        <#if required>
            <span class="${properties.kcInputRequiredClass!}">*</span>
        </#if>
    </label>
</#macro>
