<#import "field.ftl" as field>
<#macro userProfileFormFields>
    <#assign currentGroup="">

    <#list profile.attributes as attribute>
        <#if attribute.name=='locale' && realm.internationalizationEnabled && locale.currentLanguageTag?has_content>
            <input type="hidden" id="${attribute.name}" name="${attribute.name}" value="${locale.currentLanguageTag}"/>
        <#else>
            <#assign group = (attribute.group)!"">
            <#if group != currentGroup>
                <#assign currentGroup=group>
                <#if currentGroup != "">
                    <div class="${properties.kcFormGroupClass!}">
                        <#assign groupDisplayHeader=group.displayHeader!"">
                        <#if groupDisplayHeader != "">
                            <#assign groupHeaderText=advancedMsg(groupDisplayHeader)!group>
                        <#else>
                            <#assign groupHeaderText=group.name!"">
                        </#if>
                        <h2 class="kc-label">${groupHeaderText}</h2>

                        <#assign groupDisplayDescription=group.displayDescription!"">
                        <#if groupDisplayDescription != "">
                            <#assign groupDescriptionText=advancedMsg(groupDisplayDescription)!"">
                            <p class="kc-field-help">${groupDescriptionText}</p>
                        </#if>
                    </div>
                </#if>
            </#if>

            <#nested "beforeField" attribute>

            <@field.group name=attribute.name label=advancedMsg(attribute.displayName!'') error=messagesPerField.get('${attribute.name}') required=attribute.required>
                <div class="${properties.kcInputWrapperClass!}">
                    <#if attribute.annotations.inputHelperTextBefore??>
                        <div class="${properties.kcInputHelperTextBeforeClass!}" id="form-help-text-before-${attribute.name}" aria-live="polite">
                            ${kcSanitize(advancedMsg(attribute.annotations.inputHelperTextBefore))?no_esc}
                        </div>
                    </#if>
                    <@inputFieldByType attribute=attribute/>
                    <#if attribute.annotations.inputHelperTextAfter??>
                        <div class="${properties.kcInputHelperTextAfterClass!}" id="form-help-text-after-${attribute.name}" aria-live="polite">
                            ${kcSanitize(advancedMsg(attribute.annotations.inputHelperTextAfter))?no_esc}
                        </div>
                    </#if>
                </div>
            </@field.group>

            <#nested "afterField" attribute>
        </#if>
    </#list>

    <#list profile.html5DataAnnotations?keys as key>
        <script type="module" src="${url.resourcesPath}/js/${key}.js"></script>
    </#list>
</#macro>

<#macro inputFieldByType attribute>
    <#switch attribute.annotations.inputType!''>
        <#case 'textarea'>
            <@textareaTag attribute=attribute/>
            <#break>
        <#case 'select'>
        <#case 'multiselect'>
            <@selectTag attribute=attribute/>
            <#break>
        <#case 'select-radiobuttons'>
        <#case 'multiselect-checkboxes'>
            <@inputTagSelects attribute=attribute/>
            <#break>
        <#default>
            <#if attribute.multivalued && attribute.values?has_content>
                <#list attribute.values as value>
                    <@inputTag attribute=attribute value=value!''/>
                </#list>
            <#else>
                <@inputTag attribute=attribute value=(attribute.value!attribute.defaultValue!'')/>
            </#if>
    </#switch>
</#macro>

<#function profilePlaceholder attributeName>
    <#if attributeName == "username">
        <#return msg("domovoyUsernamePlaceholder")>
    <#elseif attributeName == "email">
        <#return msg("domovoyEmailPlaceholder")>
    <#elseif attributeName == "firstName">
        <#return msg("domovoyFirstNamePlaceholder")>
    <#elseif attributeName == "lastName">
        <#return msg("domovoyLastNamePlaceholder")>
    <#else>
        <#return "">
    </#if>
</#function>

<#macro inputTag attribute value>
    <#assign fieldPlaceholder = "">
    <#if attribute.annotations.inputTypePlaceholder??>
        <#assign fieldPlaceholder = advancedMsg(attribute.annotations.inputTypePlaceholder)>
    <#else>
        <#assign fieldPlaceholder = profilePlaceholder(attribute.name)>
    </#if>
    <input
        type="<@inputTagType attribute=attribute/>"
        id="${attribute.name}"
        name="${attribute.name}"
        value="${(value!'')}"
        class="${properties.kcInputClass!}"
        aria-invalid="<#if messagesPerField.existsError('${attribute.name}')>true<#else>false</#if>"
        <#if attribute.readOnly>disabled</#if>
        <#if attribute.autocomplete??>autocomplete="${attribute.autocomplete}"</#if>
        <#if fieldPlaceholder?has_content>placeholder="${fieldPlaceholder}"</#if>
        <#if attribute.annotations.inputTypePattern??>pattern="${attribute.annotations.inputTypePattern}"</#if>
        <#if attribute.annotations.inputTypeSize??>size="${attribute.annotations.inputTypeSize}"</#if>
        <#if attribute.annotations.inputTypeMaxlength??>maxlength="${attribute.annotations.inputTypeMaxlength}"</#if>
        <#if attribute.annotations.inputTypeMinlength??>minlength="${attribute.annotations.inputTypeMinlength}"</#if>
        <#if attribute.annotations.inputTypeMax??>max="${attribute.annotations.inputTypeMax}"</#if>
        <#if attribute.annotations.inputTypeMin??>min="${attribute.annotations.inputTypeMin}"</#if>
        <#if attribute.annotations.inputTypeStep??>step="${attribute.annotations.inputTypeStep}"</#if>
        <#list attribute.html5DataAnnotations as key, value>
            data-${key}="${value}"
        </#list>
    />
</#macro>

<#macro inputTagType attribute>
    <#compress>
        <#if attribute.annotations.inputType??>
            <#if attribute.annotations.inputType?starts_with("html5-")>
                ${attribute.annotations.inputType[6..]}
            <#else>
                ${attribute.annotations.inputType}
            </#if>
        <#else>
            text
        </#if>
    </#compress>
</#macro>

<#macro textareaTag attribute>
    <textarea
        id="${attribute.name}"
        name="${attribute.name}"
        class="${properties.kcInputClass!}"
        aria-invalid="<#if messagesPerField.existsError('${attribute.name}')>true<#else>false</#if>"
        <#if attribute.readOnly>disabled</#if>
        <#if attribute.annotations.inputTypeCols??>cols="${attribute.annotations.inputTypeCols}"</#if>
        <#if attribute.annotations.inputTypeRows??>rows="${attribute.annotations.inputTypeRows}"</#if>
        <#if attribute.annotations.inputTypeMaxlength??>maxlength="${attribute.annotations.inputTypeMaxlength}"</#if>
    >${(attribute.value!attribute.defaultValue!'')}</textarea>
</#macro>

<#macro selectTag attribute>
    <select
        id="${attribute.name}"
        name="${attribute.name}"
        class="${properties.kcInputClass!}"
        aria-invalid="<#if messagesPerField.existsError('${attribute.name}')>true<#else>false</#if>"
        <#if attribute.readOnly>disabled</#if>
        <#if attribute.annotations.inputType=='multiselect'>multiple</#if>
        <#if attribute.annotations.inputTypeSize??>size="${attribute.annotations.inputTypeSize}"</#if>
    >
        <#if attribute.annotations.inputType=='select'>
            <option value=""></option>
        </#if>

        <#if attribute.annotations.inputOptionsFromValidation?? && attribute.validators[attribute.annotations.inputOptionsFromValidation]?? && attribute.validators[attribute.annotations.inputOptionsFromValidation].options??>
            <#assign options=attribute.validators[attribute.annotations.inputOptionsFromValidation].options>
        <#elseif attribute.validators.options?? && attribute.validators.options.options??>
            <#assign options=attribute.validators.options.options>
        <#else>
            <#assign options=[]>
        </#if>

        <#assign selectedValues = attribute.values![]>
        <#if !selectedValues?has_content && (attribute.defaultValue??)>
            <#assign selectedValues = [attribute.defaultValue]>
        </#if>

        <#list options as option>
            <option value="${option}" <#if selectedValues?seq_contains(option)>selected</#if>><@selectOptionLabelText attribute=attribute option=option/></option>
        </#list>
    </select>
</#macro>

<#macro inputTagSelects attribute>
    <#if attribute.annotations.inputType=='select-radiobuttons'>
        <#assign inputType='radio'>
    <#else>
        <input type="hidden" id="${attribute.name}-empty" name="${attribute.name}" value=""/>
        <#assign inputType='checkbox'>
    </#if>

    <#if attribute.annotations.inputOptionsFromValidation?? && attribute.validators[attribute.annotations.inputOptionsFromValidation]?? && attribute.validators[attribute.annotations.inputOptionsFromValidation].options??>
        <#assign options=attribute.validators[attribute.annotations.inputOptionsFromValidation].options>
    <#elseif attribute.validators.options?? && attribute.validators.options.options??>
        <#assign options=attribute.validators.options.options>
    <#else>
        <#assign options=[]>
    </#if>

    <#assign selectedValues = attribute.values![]>
    <#if !selectedValues?has_content && (attribute.defaultValue??)>
        <#assign selectedValues = [attribute.defaultValue]>
    </#if>

    <#list options as option>
        <label class="kc-checkbox" for="${attribute.name}-${option}">
            <input
                type="${inputType}"
                id="${attribute.name}-${option}"
                name="${attribute.name}"
                value="${option}"
                aria-invalid="<#if messagesPerField.existsError('${attribute.name}')>true<#else>false</#if>"
                <#if attribute.readOnly>disabled</#if>
                <#if selectedValues?seq_contains(option)>checked</#if>
            />
            <span><@selectOptionLabelText attribute=attribute option=option/></span>
        </label>
    </#list>
</#macro>

<#macro selectOptionLabelText attribute option>
    <#compress>
        <#if attribute.annotations.inputOptionLabels??>
            ${advancedMsg(attribute.annotations.inputOptionLabels[option]!option)}
        <#else>
            <#if attribute.annotations.inputOptionLabelsI18nPrefix??>
                ${msg(attribute.annotations.inputOptionLabelsI18nPrefix + '.' + option)}
            <#else>
                ${option}
            </#if>
        </#if>
    </#compress>
</#macro>
