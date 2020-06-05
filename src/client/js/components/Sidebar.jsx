import React from 'react';
import PropTypes from 'prop-types';

import {
  withNavigationUIController,
  LayoutManager,
  NavigationProvider,
  ThemeProvider,
} from '@atlaskit/navigation-next';

import { withUnstatedContainers } from './UnstatedUtils';
import AppContainer from '../services/AppContainer';

import SidebarNav from './Sidebar/SidebarNav';
import RecentChanges from './Sidebar/RecentChanges';
import CustomSidebar from './Sidebar/CustomSidebar';


const sidebarDefaultWidth = 240;

class Sidebar extends React.Component {

  static propTypes = {
    appContainer: PropTypes.instanceOf(AppContainer).isRequired,
    navigationUIController: PropTypes.any.isRequired,
    isDrawerModeOnInit: PropTypes.bool,
  };

  state = {
    currentContentsId: 'recent',
  };

  componentWillMount() {
    this.hackUIController();
  }

  componentDidUpdate(prevProps, prevState) {
    const { appContainer } = this.props;

    let isDrawerMode = appContainer.state.isDrawerMode;
    if (isDrawerMode == null) {
      isDrawerMode = this.props.isDrawerModeOnInit;
    }

    this.toggleDrawerMode(isDrawerMode);
  }

  /**
   * hack and override UIController.storeState
   *
   * Since UIController is an unstated container, setState() in storeState method should be awaited before writing to cache.
   */
  hackUIController() {
    const { navigationUIController } = this.props;

    // see: @atlaskit/navigation-next/dist/esm/ui-controller/UIController.js
    const orgStoreState = navigationUIController.storeState;
    navigationUIController.storeState = async(state) => {
      await navigationUIController.setState(state);
      orgStoreState(state);
    };
  }

  toggleDrawerMode(bool) {
    const { navigationUIController } = this.props;

    const isStateModified = navigationUIController.state.isResizeDisabled !== bool;
    if (!isStateModified) {
      return;
    }

    // switch to Drawer
    if (bool) {
      // cache width
      this.sidebarWidthCached = navigationUIController.state.productNavWidth;

      navigationUIController.disableResize();
      navigationUIController.expand();

      // fix width
      navigationUIController.setState({ productNavWidth: sidebarDefaultWidth });
    }
    // switch to Dock
    else {
      navigationUIController.enableResize();

      // restore width
      if (this.sidebarWidthCached != null) {
        navigationUIController.setState({ productNavWidth: this.sidebarWidthCached });
      }
    }
  }

  backdropClickedHandler = () => {
    const { appContainer } = this.props;
    appContainer.setState({ isDrawerOpened: false });
  }

  itemSelectedHandler = (contentsId) => {
    const { navigationUIController } = this.props;
    const { currentContentsId } = this.state;

    // already selected
    if (currentContentsId === contentsId) {
      navigationUIController.toggleCollapse();
    }
    // switch and expand
    else {
      this.setState({ currentContentsId: contentsId });
      navigationUIController.expand();
    }
  }

  renderGlobalNavigation = () => (
    <SidebarNav currentContentsId={this.state.currentContentsId} onItemSelected={this.itemSelectedHandler} />
  );

  renderSidebarContents = () => {
    let contents = <CustomSidebar />;

    switch (this.state.currentContentsId) {
      case 'recent':
        contents = <RecentChanges />;
        break;
    }

    return <div className="grw-sidebar-content-container">{contents}</div>;
  }

  render() {
    const { isDrawerMode, isDrawerOpened } = this.props.appContainer.state;

    return (
      <>
        <div className={`grw-sidebar ${isDrawerMode ? 'grw-sidebar-drawer' : ''} ${isDrawerOpened ? 'open' : ''}`}>
          <ThemeProvider
            theme={theme => ({
              ...theme,
              context: 'product',
            })}
          >
            <LayoutManager
              globalNavigation={this.renderGlobalNavigation}
              productNavigation={() => null}
              containerNavigation={this.renderSidebarContents}
              experimental_hideNavVisuallyOnCollapse
              experimental_flyoutOnHover
              experimental_alternateFlyoutBehaviour
              // experimental_fullWidthFlyout
              shouldHideGlobalNavShadow
              showContextualNavigation
            >
            </LayoutManager>
          </ThemeProvider>
        </div>

        { isDrawerOpened && (
          <div className="grw-sidebar-backdrop modal-backdrop show" onClick={this.backdropClickedHandler}></div>
        ) }
      </>
    );
  }

}


const SidebarWithNavigationUIController = withNavigationUIController(Sidebar);

/**
 * Wrapper component for using unstated
 */

const SidebarWithNavigation = (props) => {
  const { preferDrawerModeByUser: isDrawerModeOnInit } = props.appContainer.state;

  const initUICForDrawerMode = isDrawerModeOnInit
    // generate initialUIController for Drawer mode
    ? {
      isCollapsed: false,
      isResizeDisabled: true,
      productNavWidth: sidebarDefaultWidth,
    }
    // set undefined (should be initialized by cache)
    : undefined;

  return (
    <NavigationProvider initialUIController={initUICForDrawerMode}>
      <SidebarWithNavigationUIController {...props} isDrawerModeOnInit={isDrawerModeOnInit} />
    </NavigationProvider>
  );
};

SidebarWithNavigation.propTypes = {
  appContainer: PropTypes.instanceOf(AppContainer).isRequired,
};

export default withUnstatedContainers(SidebarWithNavigation, [AppContainer]);
