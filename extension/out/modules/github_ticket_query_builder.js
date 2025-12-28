'use strict';

/**
 * Ticket source enumeration
 */
const TICKET_SOURCE = {
  GITHUB_TICKET: 0,
  JIRA_TICKET: 1
};

/**
 * Format ticket source for display
 * @param {number} ticketSource - The ticket source type
 * @returns {string} Display name
 */
function formatPathForDisplay(ticketSource) {
  switch (ticketSource) {
    case TICKET_SOURCE.GITHUB_TICKET:
      return 'GitHub';
    case TICKET_SOURCE.JIRA_TICKET:
      return 'Jira';
    default:
      return "Unknown";
  }
}

/**
 * Format ticket reference for display
 * @param {Object} ticketReferenceInfo - Ticket reference information
 * @returns {string} Formatted display string
 */
function formatTicketReferenceDisplay(ticketReferenceInfo) {
  switch (ticketReferenceInfo.ticketSource) {
    case TICKET_SOURCE.GITHUB_TICKET:
      if (!ticketReferenceInfo.githubTicketRef) throw new Error("GitHub ticket reference not found");
      return formatPathForDisplay(ticketReferenceInfo.ticketSource) + ': ' + 
        (ticketReferenceInfo.githubTicketRef.organizationLogin ?? ticketReferenceInfo.githubTicketRef.userLogin) + '/' + 
        ticketReferenceInfo.githubTicketRef.repositoryName + '/' + 
        ticketReferenceInfo.githubTicketRef.issueNumber;
    default:
      throw new Error('Unsupported ticket source: ' + ticketReferenceInfo.ticketSource);
  }
}

/**
 * Get GitHub issue URL
 * @param {Object} ticketReferenceInfo - Ticket reference information
 * @returns {string} GitHub issue URL
 */
function getGitHubIssueUrl(ticketReferenceInfo) {
  switch (ticketReferenceInfo.ticketSource) {
    case TICKET_SOURCE.GITHUB_TICKET:
      if (!ticketReferenceInfo.githubTicketRef) throw new Error("GitHub ticket reference not found");
      return "https://github.com/" + 
        ticketReferenceInfo.githubTicketRef.organizationLogin + '/' + 
        ticketReferenceInfo.githubTicketRef.repositoryName + '/issues/' + 
        ticketReferenceInfo.githubTicketRef.issueNumber;
    default:
      throw new Error("Unsupported ticket source: " + ticketReferenceInfo.ticketSource);
  }
}

/**
 * Builder for constructing GitHub ticket query in JSON format
 */
class GitHubTicketQueryBuilder {
  constructor(ticketReferenceInfo) {
    this._ticketReferenceInfo = ticketReferenceInfo;
  }

  /**
   * Construct JSON query from persisted plan
   * @param {Object} persistedPlan - The persisted plan with ticket input
   * @returns {Object} JSON query document
   */
  constructJsonQuery(persistedPlan) {
    const ticketReferenceInfo = this._ticketReferenceInfo;
    const { githubTicketRef } = ticketReferenceInfo;
    
    if (!githubTicketRef || !persistedPlan.ticketInput) {
      throw new Error('GitHub ticket reference or persisted plan is not found');
    }

    const displayLabel = formatTicketReferenceDisplay(ticketReferenceInfo);
    const issueUrl = getGitHubIssueUrl(ticketReferenceInfo);
    const attachmentMentions = persistedPlan.ticketInput.attachments
      .map(attachment => attachment.file ? {
        type: 'mention',
        attrs: {
          contenteditable: false,
          type: "mention",
          contextType: 'attachment',
          label: attachment.file.fileName,
          id: attachment.file.fileName,
          b64content: attachment.file.b64content,
          fileName: attachment.file.fileName
        }
      } : null)
      .filter(mention => mention !== null);

    return {
      type: "doc",
      content: [{
        type: "paragraph",
        content: [{
          type: "mention",
          attrs: {
            contenteditable: false,
            type: "mention",
            contextType: "github_issue",
            label: displayLabel,
            id: issueUrl,
            issueNumber: githubTicketRef.issueNumber,
            organizationLogin: githubTicketRef.organizationLogin,
            repositoryName: githubTicketRef.repositoryName,
            userLogin: githubTicketRef.userLogin
          }
        }, {
          type: "text",
          text: ': ' + persistedPlan.ticketInput.title
        }, ...attachmentMentions]
      }]
    };
  }
}

// CommonJS exports
module.exports = {
  TICKET_SOURCE,
  formatPathForDisplay,
  formatTicketReferenceDisplay,
  getGitHubIssueUrl,
  GitHubTicketQueryBuilder
};

