/*********************************************************************
 * Copyright (c) 2021 Red Hat, Inc.
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 **********************************************************************/

import { Key } from 'selenium-webdriver';
import { e2eContainer } from '../../inversify.config';
import { WorkspaceNameHandler } from '../../utils/WorkspaceNameHandler';
import { Dashboard } from '../../pageobjects/dashboard/Dashboard';
import { Ide } from '../../pageobjects/ide/Ide';
import { CLASSES } from '../../inversify.types';
import { ProjectTree } from '../../pageobjects/ide/ProjectTree';
import { Editor } from '../../pageobjects/ide/Editor';
import { TestConstants } from '../../TestConstants';
import { TimeoutConstants } from '../../TimeoutConstants';
import { BrowserTabsUtil } from '../../utils/BrowserTabsUtil';

const dashboard: Dashboard = e2eContainer.get(CLASSES.Dashboard);

const ide: Ide = e2eContainer.get(CLASSES.Ide);
const projectTree: ProjectTree = e2eContainer.get(CLASSES.ProjectTree);
const editor: Editor = e2eContainer.get(CLASSES.Editor);
const browserTabsUtil: BrowserTabsUtil = e2eContainer.get(CLASSES.BrowserTabsUtil);

let workspaceName: string = '';

const devfileUrl: string = 'https://gist.githubusercontent.com/Ohrimenko1988/c987cd272cf96494b4b615f0e093c132/raw/dfa4a0d00d68b9fb28c04b323eea424952d75a7f/GoPlugin.yaml';
const factoryUrl: string = `${TestConstants.TS_SELENIUM_BASE_URL}/f?url=${devfileUrl}`;
const projectName: string = 'example';
const pathToFile: string = `${projectName}/hello`;
const fileName: string = 'hello.go';

suite('The "GoPlugin" userstory', async () => {
    suite('Create workspace', async () => {
        test('Create workspace using factory', async () => {
            await browserTabsUtil.navigateTo(factoryUrl);
        });

        test('Wait until created workspace is started', async () => {
            await ide.waitAndSwitchToIdeFrame();
            await ide.waitIde(TimeoutConstants.TS_SELENIUM_START_WORKSPACE_TIMEOUT);

            workspaceName = await WorkspaceNameHandler.getNameFromUrl();
        });
    });

    suite('Check workspace readiness to work', async () => {
        test('Wait until project is imported', async () => {
            await projectTree.openProjectTreeContainer();
            await projectTree.waitProjectImported(projectName, 'hello');
        });
    });

    suite('Check the "Go" plugin', async () => {
        test('Check autocomplete', async () => {
            await projectTree.expandPathAndOpenFile(pathToFile, fileName);
            await editor.waitSuggestion(fileName, 'rollback', 60000, 16, 4);
        });

        test('Check error appearance', async () => {
            await projectTree.expandPathAndOpenFile(pathToFile, fileName);

            await editor.type(fileName, '\$\%\^\#', 16);
            await editor.waitErrorInLine(16);
        });

        test('Check error disappearance', async () => {
            await editor.performKeyCombination(fileName, Key.chord(Key.BACK_SPACE, Key.BACK_SPACE, Key.BACK_SPACE, Key.BACK_SPACE));
            await editor.waitErrorInLineDisappearance(16);
        });

    });

    suite('Delete workspace', async () => {
        test('Delete workspace', async () => {
            await dashboard.stopAndRemoveWorkspaceByUI(workspaceName);
        });
    });
});
