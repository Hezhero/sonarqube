/*
 * SonarQube
 * Copyright (C) 2009-2024 SonarSource SA
 * mailto:info AT sonarsource DOT com
 *
 * This program is free software; you can redistribute it and/or
 * modify it under the terms of the GNU Lesser General Public
 * License as published by the Free Software Foundation; either
 * version 3 of the License, or (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
 * Lesser General Public License for more details.
 *
 * You should have received a copy of the GNU Lesser General Public License
 * along with this program; if not, write to the Free Software Foundation,
 * Inc., 51 Franklin Street, Fifth Floor, Boston, MA  02110-1301, USA.
 */
import { useTheme } from '@emotion/react';
import styled from '@emotion/styled';
import classNames from 'classnames';
import {
  ChevronRightIcon,
  ClipboardIconButton,
  HoverLink,
  InteractiveIcon,
  LightLabel,
  Link,
  Spinner,
  UnfoldIcon,
  themeColor,
} from 'design-system';
import * as React from 'react';
import { getBranchLikeQuery, isBranch, isPullRequest } from '~sonar-aligned/helpers/branch-like';
import { getComponentIssuesUrl } from '~sonar-aligned/helpers/urls';
import { ComponentQualifier } from '~sonar-aligned/types/component';
import { ComponentContext } from '../../../app/components/componentContext/ComponentContext';
import { useCurrentUser } from '../../../app/components/current-user/CurrentUserContext';
import { DEFAULT_ISSUES_QUERY } from '../../../components/shared/utils';
import { translate } from '../../../helpers/l10n';
import { collapsedDirFromPath, fileFromPath } from '../../../helpers/path';
import { getBranchLikeUrl } from '../../../helpers/urls';
import { useBranchesQuery } from '../../../queries/branch';
import { SourceViewerFile } from '../../../types/types';
import { isLoggedIn } from '../../../types/users';
import { IssueOpenInIdeButton } from '../components/IssueOpenInIdeButton';

export const INTERACTIVE_TOOLTIP_DELAY = 0.5;

export interface Props {
  className?: string;
  displayProjectName?: boolean;
  expandable?: boolean;
  issueKey: string;
  linkToProject?: boolean;
  loading?: boolean;
  onExpand?: () => void;
  sourceViewerFile: SourceViewerFile;
}

export function IssueSourceViewerHeader(props: Readonly<Props>) {
  const {
    className,
    displayProjectName = true,
    expandable,
    issueKey,
    linkToProject = true,
    loading,
    onExpand,
    sourceViewerFile,
  } = props;

  const { measures, path, project, projectName, q } = sourceViewerFile;

  const { component } = React.useContext(ComponentContext);
  const { data: branchData, isLoading: isLoadingBranches } = useBranchesQuery(
    component ?? {
      key: project,
      name: projectName,
      qualifier: ComponentQualifier.Project,
    },
  );
  const { currentUser } = useCurrentUser();
  const theme = useTheme();

  const branchLike = branchData?.branchLike;

  const isProjectRoot = q === ComponentQualifier.Project;

  const borderColor = themeColor('codeLineBorder')({ theme });

  const IssueSourceViewerStyle = styled.div`
    border: 1px solid ${borderColor};
    border-bottom: none;
  `;

  const [branchName, pullRequestID] = React.useMemo(() => {
    if (isBranch(branchLike)) {
      return [branchLike.name, undefined];
    }

    if (isPullRequest(branchLike)) {
      return [branchLike.branch, branchLike.key];
    }

    return [undefined, undefined]; // should never end up here, but needed for consistent returns
  }, [branchLike]);

  return (
    <IssueSourceViewerStyle
      aria-label={sourceViewerFile.path}
      className={classNames(
        'sw-flex sw-justify-space-between sw-items-center sw-px-4 sw-py-3 sw-text-sm',
        className,
      )}
      role="separator"
    >
      <div className="sw-flex-1">
        {displayProjectName && (
          <>
            {linkToProject ? (
              <LightLabel>
                <HoverLink to={getBranchLikeUrl(project, branchLike)} className="sw-mr-2">
                  {projectName}
                </HoverLink>
              </LightLabel>
            ) : (
              <LightLabel className="sw-ml-1 sw-mr-2">{projectName}</LightLabel>
            )}
          </>
        )}

        {!isProjectRoot && (
          <span className="sw-whitespace-nowrap">
            {displayProjectName && <ChevronRightIcon className="sw-mr-2" />}

            <LightLabel>
              {collapsedDirFromPath(path)}
              {fileFromPath(path)}
            </LightLabel>
            <ClipboardIconButton
              className="sw-h-6 sw-mx-2"
              copyValue={path}
              copyLabel={translate('source_viewer.click_to_copy_filepath')}
            />
          </span>
        )}
      </div>

      {!isProjectRoot && isLoggedIn(currentUser) && !isLoadingBranches && (
        <IssueOpenInIdeButton
          branchName={branchName}
          issueKey={issueKey}
          login={currentUser.login}
          projectKey={project}
          pullRequestID={pullRequestID}
        />
      )}

      {!isProjectRoot && measures.issues !== undefined && (
        <div
          className={classNames('sw-ml-4', {
            'sw-mr-1': (!expandable || loading) ?? isLoadingBranches,
          })}
        >
          <Link
            to={getComponentIssuesUrl(project, {
              ...getBranchLikeQuery(branchLike),
              files: path,
              ...DEFAULT_ISSUES_QUERY,
            })}
          >
            {translate('source_viewer.view_all_issues')}
          </Link>
        </div>
      )}

      <Spinner className="sw-mr-1" loading={loading ?? isLoadingBranches} />

      {expandable && !(loading ?? isLoadingBranches) && (
        <div className="sw-ml-4">
          <InteractiveIcon
            Icon={UnfoldIcon}
            aria-label={translate('source_viewer.expand_all_lines')}
            className="sw-h-6"
            onClick={onExpand}
          />
        </div>
      )}
    </IssueSourceViewerStyle>
  );
}
