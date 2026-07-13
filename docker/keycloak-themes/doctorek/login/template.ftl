<#macro registrationLayout bodyClass="" displayInfo=false displayMessage=true displayRequiredFields=false>
<!DOCTYPE html>
<html class="${properties.kcHtmlClass!}"<#if realm.internationalizationEnabled> lang="${locale.currentLanguageTag}"</#if>>

<head>
    <meta charset="utf-8">
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="robots" content="noindex, nofollow">
    <title>Connexion – Doctorek</title>
    <link rel="icon" href="${url.resourcesPath}/img/logo0.png" />
    <#if properties.styles?has_content>
        <#list properties.styles?split(' ') as style>
            <link href="${url.resourcesPath}/${style}" rel="stylesheet" />
        </#list>
    </#if>
    <script type="importmap">
        {
            "imports": {
                "rfc4648": "${url.resourcesCommonPath}/node_modules/rfc4648/lib/rfc4648.js"
            }
        }
    </script>
    <#if scripts??>
        <#list scripts as script>
            <script src="${script}" type="text/javascript"></script>
        </#list>
    </#if>
    <script type="module">
        import { checkCookiesAndSetTimer } from "${url.resourcesPath}/js/authChecker.js";
        checkCookiesAndSetTimer("${url.ssoLoginInOtherTabsUrl?no_esc}");
    </script>
</head>

<body class="dk-body">
    <#assign appUrl = properties.doctorekAppUrl!''>

    <#-- App header — same as components/Header.tsx -->
    <header class="dk-header">
        <div class="dk-header-inner">
            <a href="${appUrl}/" class="dk-logo">
                <img src="${url.resourcesPath}/img/logo0.png" alt="Doctorek" />
            </a>
            <nav class="dk-header-nav">
                <a class="dk-btn-soignant" href="${appUrl}/inscription?role=medecin">Vous êtes soignant ?</a>
                <a class="dk-link-aide" href="${appUrl}/aide">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                    Centre d'aide
                </a>
                <span class="dk-link-connect">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="8" r="5"/><path d="M20 21a8 8 0 0 0-16 0"/></svg>
                    <span class="dk-link-connect-text">
                        <span class="dk-link-connect-title">Se connecter</span>
                        <span class="dk-link-connect-sub">Gérer mes RDV</span>
                    </span>
                </span>
            </nav>
        </div>
    </header>

    <#-- AuthShell — same as features/auth/components/AuthShell.tsx -->
    <main class="dk-shell">
        <div class="dk-card">

            <#-- Left dark panel with blobs, logo, illustration, tagline -->
            <section class="dk-left" aria-hidden="true">
                <span class="dk-blob dk-blob-tl"></span>
                <span class="dk-blob dk-blob-tr"></span>
                <span class="dk-blob dk-blob-bl"></span>
                <span class="dk-blob dk-blob-br"></span>

                <div class="dk-left-logo">
                    <img src="${url.resourcesPath}/img/logo0.png" alt="" />
                </div>

                <div class="dk-left-illustration">
                    <img src="${url.resourcesPath}/img/login.png" alt="" />
                </div>

                <div class="dk-left-tagline">
                    <p class="dk-eyebrow">Espace patient &amp; médecin</p>
                    <p class="dk-tagline-text">
                        Votre santé, centralisée. Gérez vos rendez-vous, consultez votre
                        dossier et restez connecté à votre médecin.
                    </p>
                </div>
            </section>

            <#-- Right form panel -->
            <section class="dk-right">
                <div class="dk-mobile-logo">
                    <img src="${url.resourcesPath}/img/logo0.png" alt="Doctorek" />
                </div>

                <div class="dk-right-heading">
                    <h2>Connexion</h2>
                    <p>Accédez à votre espace patient ou médecin.</p>
                </div>

                <#-- Keycloak page title kept for screen readers only -->
                <span class="dk-visually-hidden" id="kc-page-title"><#nested "header"></span>

                <div id="kc-content">
                    <div id="kc-content-wrapper">
                        <#if displayMessage && message?has_content && (message.type != 'warning' || !isAppInitiatedAction??)>
                            <div class="dk-alert dk-alert-${message.type}">
                                <span>${kcSanitize(message.summary)?no_esc}</span>
                            </div>
                        </#if>

                        <#nested "socialProviders">

                        <#nested "form">

                        <#if auth?has_content && auth.showTryAnotherWayLink()>
                            <form id="kc-select-try-another-way-form" action="${url.loginAction}" method="post">
                                <input type="hidden" name="tryAnotherWay" value="on"/>
                                <a href="#" id="try-another-way"
                                   onclick="document.forms['kc-select-try-another-way-form'].submit();return false;">${msg("doTryAnotherWay")}</a>
                            </form>
                        </#if>

                        <#if displayInfo>
                            <div id="kc-info">
                                <div id="kc-info-wrapper">
                                    <#nested "info">
                                </div>
                            </div>
                        </#if>

                        <div class="dk-divider"><span>nouveau sur Doctorek ?</span></div>
                        <p class="dk-register">
                            <a href="${appUrl}/inscription">Créer un compte gratuitement →</a>
                        </p>
                    </div>
                </div>

                <p class="dk-privacy">
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                    Données médicales protégées · CNDP Maroc
                </p>
            </section>
        </div>
    </main>
</body>
</html>
</#macro>
