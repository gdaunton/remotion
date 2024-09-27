import {describe, expect, it} from 'bun:test';
import {CreateVideoInternals, Template} from 'create-video';
import {existsSync, readFileSync} from 'node:fs';
import path from 'node:path';

const {FEATURED_TEMPLATES} = CreateVideoInternals;

const getFileForTemplate = (template: Template, file: string) => {
	return path.join(process.cwd(), '..', template.templateInMonorepo, file);
};

const findFile = async (options: string[]) => {
	let entryPoint: string | null = null;
	let contents: string | null = null;
	for (const point of options) {
		const exists = existsSync(point);
		if (exists) {
			const res = readFileSync(point, 'utf-8');
			entryPoint = point;
			contents = res;
			break;
		}
	}

	return {entryPoint, contents};
};

describe('Templates should be valid', () => {
	for (const template of FEATURED_TEMPLATES) {
		it(`${template.shortName} should have a valid package.json`, async () => {
			const packageJson = getFileForTemplate(template, 'package.json');

			const res = readFileSync(packageJson, 'utf8');
			const body = JSON.parse(res);

			if (
				!template.shortName.includes('Remix') &&
				!template.shortName.includes('Next') &&
				!template.shortName.includes('Still')
			) {
				expect(body.scripts.build).toMatch(/render/);
				expect(body.scripts.build).not.toContain('index');
			}

			expect(body.dependencies.remotion).toBe('workspace:*');
			expect(body.dependencies['@remotion/cli']).toMatch('workspace:*');
			expect(body.dependencies.react).toMatch(/^\^?18/);
			expect(body.dependencies['react-dom']).toMatch(/^\^?18/);

			if (body.dependencies['zod']) {
				expect(body.dependencies['zod']).toBe('3.22.3');
			}
			if (body.dependencies['@types/web']) {
				expect(body.dependencies['@types/web']).toInclude('0.0.166');
			}

			expect(body.devDependencies.prettier).toMatch('3.3.3');
			expect(body.private).toBe(true);
			expect(body.name).toStartWith('template-');

			if (!template.shortName.includes('JavaScript')) {
				expect(body.devDependencies['typescript']).toInclude('5.6.2');

				// eslint-disable-next-line @typescript-eslint/no-unused-vars
				const eitherPluginOrConfig =
					body.devDependencies['@remotion/eslint-config']?.match(
						'workspace:*',
					) ||
					body.devDependencies['@remotion/eslint-plugin']?.match('workspace:*');
				expect(eitherPluginOrConfig).toBeTruthy();
			}
		});

		it(`${template.shortName} should not have any lockfiles`, async () => {
			expect(
				existsSync(getFileForTemplate(template, 'package-lock.json')),
			).toBe(false);
			expect(existsSync(getFileForTemplate(template, 'yarn.lock'))).toBe(false);
			expect(existsSync(getFileForTemplate(template, 'pnpm-lock.yaml'))).toBe(
				false,
			);
			expect(existsSync(getFileForTemplate(template, 'bun.lockb'))).toBe(false);
		});

		it(`${template.shortName} should have a standard entry point`, async () => {
			const {contents, entryPoint} = await findFile([
				getFileForTemplate(template, 'src/index.ts'),
				getFileForTemplate(template, 'src/index.js'),
				getFileForTemplate(template, 'remotion/index.ts'),
				getFileForTemplate(template, 'app/remotion/index.ts'),
			]);
			expect(entryPoint).toBeTruthy();
			expect(contents).toMatch(/RemotionRoot/);
		});

		it(`${template.shortName} should have a standard Root file`, async () => {
			const {contents, entryPoint} = await findFile([
				getFileForTemplate(template, 'src/Root.tsx'),
				getFileForTemplate(template, 'src/Root.jsx'),
				getFileForTemplate(template, 'remotion/Root.tsx'),
				getFileForTemplate(template, 'app/remotion/Root.tsx'),
			]);
			expect(entryPoint).toBeTruthy();
			expect(contents).toMatch(/export const RemotionRoot/);
		});

		it(`${template.shortName} should use the new config file format`, async () => {
			const {contents, entryPoint} = await findFile([
				getFileForTemplate(template, 'remotion.config.ts'),
				getFileForTemplate(template, 'remotion.config.js'),
			]);
			expect(entryPoint).toBeTruthy();
			expect(contents).not.toContain('Config.Rendering');
			expect(contents).not.toContain('Config.Bundling');
			expect(contents).not.toContain('Config.Log');
			expect(contents).not.toContain('Config.Puppeteer');
			expect(contents).not.toContain('Config.Output');
			expect(contents).not.toContain('Config.Preview');
		});

		it(`${template.shortName} should use noUnusedLocals`, async () => {
			if (template.shortName.includes('JavaScript')) {
				return;
			}

			const {contents} = await findFile([
				getFileForTemplate(template, 'tsconfig.json'),
			]);
			if (template.shortName.includes('Skia')) {
				expect(contents).toInclude('noUnusedLocals": false');
			} else {
				expect(contents).toInclude('noUnusedLocals": true');
			}
		});

		it(`${template.shortName} should use correct prettier`, async () => {
			const {contents} = await findFile([
				getFileForTemplate(template, '.prettierrc'),
			]);
			expect(contents).toBe(`{
  "useTabs": false,
  "bracketSpacing": true,
  "tabWidth": 2
}
`);
		});
		it(`${template.shortName} should be registered in tsconfig.json`, async () => {
			const tsconfig = path.join(process.cwd(), '..', '..', 'tsconfig.json');
			const contents = readFileSync(tsconfig, 'utf8');
			const parsed = JSON.parse(contents);

			const references = parsed.references.map((r: any) =>
				r.path.replace('./packages/', ''),
			);
			if (!template.shortName.includes('JavaScript')) {
				expect(references).toContain(template.templateInMonorepo);
			}
		});
	}
});
