import React from 'react';
import PropTypes from 'prop-types';
import loggerFactory from '@alias/logger';

import { createSubscribedElement } from './UnstatedUtils';
import AppContainer from '../services/AppContainer';
import PageContainer from '../services/PageContainer';
import EditorContainer from '../services/EditorContainer';

import MarkdownTable from '../models/MarkdownTable';

import RevisionRenderer from './Page/RevisionRenderer';
import HandsontableModal from './PageEditor/HandsontableModal';
import DrawioIFrame from './PageEditor/DrawioIFrame';
import mtu from './PageEditor/MarkdownTableUtil';
import mdu from './PageEditor/MarkdownDrawioUtil';

const logger = loggerFactory('growi:Page');

class Page extends React.Component {

  constructor(props) {
    super(props);

    this.state = {
      currentTargetTableArea: null,
      currentTargetDrawioArea: null,
    };

    this.growiRenderer = this.props.appContainer.getRenderer('page');

    this.saveHandlerForHandsontableModal = this.saveHandlerForHandsontableModal.bind(this);
    this.saveHandlerForDrawioIFrame = this.saveHandlerForDrawioIFrame.bind(this);
  }

  componentWillMount() {
    this.props.appContainer.registerComponentInstance('Page', this);
  }

  /**
   * launch HandsontableModal with data specified by arguments
   * @param beginLineNumber
   * @param endLineNumber
   */
  launchHandsontableModal(beginLineNumber, endLineNumber) {
    const markdown = this.props.pageContainer.state.markdown;
    const tableLines = markdown.split(/\r\n|\r|\n/).slice(beginLineNumber - 1, endLineNumber).join('\n');
    this.setState({ currentTargetTableArea: { beginLineNumber, endLineNumber } });
    this.handsontableModal.show(MarkdownTable.fromMarkdownString(tableLines));
  }

  /**
   * launch DrawioIFrame with data specified by arguments
   * @param beginLineNumber
   * @param endLineNumber
   */
  launchDrawioIFrame(beginLineNumber, endLineNumber) {
    const markdown = this.props.pageContainer.state.markdown;
    const drawioMarkdownArray = markdown.split(/\r\n|\r|\n/).slice(beginLineNumber, endLineNumber);
    const drawioData = drawioMarkdownArray.slice(1, drawioMarkdownArray.length - 1).join('\n').trim();
    this.setState({ currentTargetDrawioArea: { beginLineNumber, endLineNumber } });
    this.drawioIFrame.show(drawioData);
  }

  async saveHandlerForHandsontableModal(markdownTable) {
    const { pageContainer, editorContainer } = this.props;
    const optionsToSave = editorContainer.getCurrentOptionsToSave();

    const newMarkdown = mtu.replaceMarkdownTableInMarkdown(
      markdownTable,
      this.props.pageContainer.state.markdown,
      this.state.currentTargetTableArea.beginLineNumber,
      this.state.currentTargetTableArea.endLineNumber,
    );

    try {
      // disable unsaved warning
      editorContainer.disableUnsavedWarning();

      // eslint-disable-next-line no-unused-vars
      const { page, tags } = await pageContainer.save(newMarkdown, optionsToSave);
      logger.debug('success to save');

      pageContainer.showSuccessToastr();
    }
    catch (error) {
      logger.error('failed to save', error);
      pageContainer.showErrorToastr(error);
    }
    finally {
      this.setState({ currentTargetTableArea: null });
    }
  }

  async saveHandlerForDrawioIFrame(drawioData) {
    const { pageContainer, editorContainer } = this.props;
    const optionsToSave = editorContainer.getCurrentOptionsToSave();

    const newMarkdown = mdu.replaceDrawioInMarkdown(
      drawioData,
      this.props.pageContainer.state.markdown,
      this.state.currentTargetDrawioArea.beginLineNumber,
      this.state.currentTargetDrawioArea.endLineNumber,
    );

    try {
      // disable unsaved warning
      editorContainer.disableUnsavedWarning();

      // eslint-disable-next-line no-unused-vars
      const { page, tags } = await pageContainer.save(newMarkdown, optionsToSave);
      logger.debug('success to save');

      pageContainer.showSuccessToastr();
    }
    catch (error) {
      logger.error('failed to save', error);
      pageContainer.showErrorToastr(error);
    }
    finally {
      this.setState({ currentTargetDrawioArea: null });
    }
  }

  render() {
    const isMobile = this.props.appContainer.isMobile;
    const { markdown } = this.props.pageContainer.state;

    return (
      <div className={isMobile ? 'page-mobile' : ''}>
        <RevisionRenderer growiRenderer={this.growiRenderer} markdown={markdown} />
        <HandsontableModal ref={(c) => { this.handsontableModal = c }} onSave={this.saveHandlerForHandsontableModal} />
        <DrawioIFrame ref={(c) => { this.drawioIFrame = c }} onSave={this.saveHandlerForDrawioIFrame} />
      </div>
    );
  }

}

/**
 * Wrapper component for using unstated
 */
const PageWrapper = (props) => {
  return createSubscribedElement(Page, props, [AppContainer, PageContainer, EditorContainer]);
};


Page.propTypes = {
  appContainer: PropTypes.instanceOf(AppContainer).isRequired,
  pageContainer: PropTypes.instanceOf(PageContainer).isRequired,
  editorContainer: PropTypes.instanceOf(EditorContainer).isRequired,
};

export default PageWrapper;
