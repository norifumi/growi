module.exports = function(crowi, app, req, locals) {
  const debug = require('debug')('growi:lib:swigFunctions');
  const stringWidth = require('string-width');
  const Page = crowi.model('Page');
  const User = crowi.model('User');
  const {
    configManager,
    cdnResourcesService,
    passportService,
    appService,
    fileUploadService,
  } = crowi;
  debug('initializing swigFunctions');

  locals.nodeVersion = function() {
    return crowi.runtimeVersions.versions.node ? crowi.runtimeVersions.versions.node.version : '-';
  };
  locals.npmVersion = function() {
    return crowi.runtimeVersions.versions.npm ? crowi.runtimeVersions.versions.npm.version : '-';
  };
  locals.yarnVersion = function() {
    return crowi.runtimeVersions.versions.yarn ? crowi.runtimeVersions.versions.yarn.version : '-';
  };

  locals.growiVersion = function() {
    return crowi.version;
  };

  // token getter
  locals.csrf = function() {
    return req.csrfToken;
  };

  locals.getAppTitleFontSize = function(appTitle) {
    const appTitleWidth = stringWidth(appTitle);
    let fontSize = 22;
    if (appTitleWidth < 13) { /* do nothing */ }
    else if (appTitleWidth < 21) {
      fontSize -= 3 * (Math.floor((appTitleWidth - 13) / 3) + 1);
    }
    else {
      fontSize = 11;
    }
    return fontSize;
  };

  /**
   * @see ConfigManager#getConfig
   */
  locals.getConfig = configManager.getConfig.bind(configManager);

  /**
   * **Do not use this unless absolutely necessary. Use getConfig instead.**
   */
  locals.getConfigFromDB = configManager.getConfigFromDB.bind(configManager);

  /**
   * **Do not use this unless absolutely necessary. Use getConfig instead.**
   */
  locals.getConfigFromEnvVars = configManager.getConfigFromEnvVars.bind(configManager);

  /**
   * pass service class to swig
   */
  locals.appService = appService;
  locals.fileUploadService = fileUploadService;

  locals.noCdn = function() {
    return !!process.env.NO_CDN;
  };

  locals.cdnScriptTag = function(name) {
    return cdnResourcesService.getScriptTagByName(name);
  };
  locals.cdnScriptTagsByGroup = function(group) {
    const tags = cdnResourcesService.getScriptTagsByGroup(group);
    return tags.join('\n');
  };

  locals.cdnStyleTag = function(name) {
    return cdnResourcesService.getStyleTagByName(name);
  };

  locals.cdnStyleTagsByGroup = function(group) {
    const tags = cdnResourcesService.getStyleTagsByGroup(group);
    return tags.join('\n');
  };

  locals.cdnHighlightJsStyleTag = function(styleName) {
    return cdnResourcesService.getHighlightJsStyleTag(styleName);
  };

  /**
   * return true if enabled and strategy has been setup successfully
   */
  locals.isLdapSetup = function() {
    return (
      configManager.getConfig('crowi', 'security:passport-ldap:isEnabled')
      && passportService.isLdapStrategySetup
    );
  };

  /**
   * return true if enabled but strategy has some problem
   */
  locals.isLdapSetupFailed = function() {
    return (
      configManager.getConfig('crowi', 'security:passport-ldap:isEnabled')
      && !passportService.isLdapStrategySetup
    );
  };

  locals.getSamlMissingMandatoryConfigKeys = function() {
    return crowi.passportService.getSamlMissingMandatoryConfigKeys();
  };

  locals.searchConfigured = function() {
    if (crowi.getSearcher()) {
      return true;
    }
    return false;
  };

  locals.isHackmdSetup = function() {
    return process.env.HACKMD_URI != null;
  };

  locals.customCss = function() {
    const customizeService = crowi.customizeService;
    return customizeService.getCustomCss();
  };

  locals.customScript = function() {
    const customizeService = crowi.customizeService;
    return customizeService.getCustomScript();
  };

  locals.customHeader = function() {
    return configManager.getConfig('crowi', 'customize:header') || '';
  };

  locals.customTitle = function(page) {
    const customizeService = crowi.customizeService;
    return customizeService.generateCustomTitle(page);
  };

  locals.behaviorType = function() {
    return configManager.getConfig('crowi', 'customize:behavior');
  };

  locals.layoutType = function() {
    return configManager.getConfig('crowi', 'customize:layout');
  };

  locals.highlightJsStyle = function() {
    return configManager.getConfig('crowi', 'customize:highlightJsStyle');
  };

  locals.highlightJsStyleBorder = function() {
    return configManager.getConfig('crowi', 'customize:highlightJsStyleBorder');
  };

  locals.isEnabledTimeline = function() {
    return configManager.getConfig('crowi', 'customize:isEnabledTimeline');
  };

  locals.parentPath = function(path) {
    if (path === '/') {
      return path;
    }

    if (path.match(/.+\/$/)) {
      return path;
    }

    return `${path}/`;
  };

  locals.isUserPageList = function(path) {
    if (path.match(/^\/user\/[^/]+\/$/)) {
      return true;
    }

    return false;
  };

  locals.isTopPage = function() {
    const path = req.path || '';
    if (path === '/') {
      return true;
    }

    return false;
  };

  locals.isTrashPage = function() {
    const path = req.path || '';
    if (path.match(/^\/trash\/.*/)) {
      return true;
    }

    return false;
  };

  locals.isDeletablePage = function() {
    const Page = crowi.model('Page');
    const path = req.path || '';

    return Page.isDeletableName(path);
  };

  locals.userPageRoot = function(user) {
    if (!user || !user.username) {
      return '';
    }
    return `/user/${user.username}`;
  };

  locals.css = {
    grant(pageData) {
      if (!pageData) {
        return '';
      }

      switch (pageData.grant) {
        case Page.GRANT_PUBLIC:
          return 'grant-public';
        case Page.GRANT_RESTRICTED:
          return 'grant-restricted';
        // case Page.GRANT_SPECIFIED:
        //  return 'grant-specified';
        //  break;
        case Page.GRANT_OWNER:
          return 'grant-owner';
        default:
          break;
      }
      return '';
    },
    userStatus(user) {
      switch (user.status) {
        case User.STATUS_REGISTERED:
          return 'label-info';
        case User.STATUS_ACTIVE:
          return 'label-success';
        case User.STATUS_SUSPENDED:
          return 'label-warning';
        case User.STATUS_DELETED:
          return 'label-danger';
        case User.STATUS_INVITED:
          return 'label-info';
        default:
          break;
      }
      return '';
    },
  };
};
