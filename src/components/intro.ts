import { Container, Spacer, Text } from '@mariozechner/pi-tui';
import packageJson from '../../package.json';
import { getModelDisplayName } from '../utils/model.js';
import { theme } from '../theme.js';

const INTRO_WIDTH = 50;

export class IntroComponent extends Container {
  private readonly modelText: Text;
  private readonly stepsText: Text;

  constructor(model: string) {
    super();

    const welcomeText = 'Welcome to Kabuto';
    const versionText = ` v${packageJson.version}`;
    const fullText = welcomeText + versionText;
    const padding = Math.floor((INTRO_WIDTH - fullText.length - 2) / 2);
    const trailing = INTRO_WIDTH - fullText.length - padding - 2;

    this.addChild(new Spacer(1));
    this.addChild(new Text(theme.primary('═'.repeat(INTRO_WIDTH)), 0, 0));
    this.addChild(
      new Text(
        theme.primary(
          `║${' '.repeat(padding)}${theme.bold(welcomeText)}${theme.muted(versionText)}${' '.repeat(
            trailing,
          )}║`,
        ),
        0,
        0,
      ),
    );
    this.addChild(new Text(theme.primary('═'.repeat(INTRO_WIDTH)), 0, 0));
    this.addChild(new Spacer(1));

    this.addChild(
      new Text(
        theme.bold(
          theme.primary(
            `
██╗  ██╗ █████╗ ██████╗ ██╗   ██╗████████╗ ██████╗
██║ ██╔╝██╔══██╗██╔══██╗██║   ██║╚══██╔══╝██╔═══██╗
█████╔╝ ███████║██████╔╝██║   ██║   ██║   ██║   ██║
██╔═██╗ ██╔══██║██╔══██╗██║   ██║   ██║   ██║   ██║
██║  ██╗██║  ██║██████╔╝╚██████╔╝   ██║   ╚██████╔╝
╚═╝  ╚═╝╚═╝  ╚═╝╚═════╝  ╚═════╝    ╚═╝    ╚═════╝ `,
          ),
        ),
        0,
        0,
      ),
    );

    this.addChild(new Spacer(1));
    this.addChild(new Text('日本株市場に特化したAI金融リサーチエージェント', 0, 0));
    this.modelText = new Text('', 0, 0);
    this.addChild(this.modelText);
    this.setModel(model);
    this.stepsText = new Text('', 0, 0);
    this.addChild(this.stepsText);
    this.setSteps(10);
  }

  setModel(model: string) {
    this.modelText.setText(
      `${theme.muted('Model: ')}${theme.primary(getModelDisplayName(model))}${theme.muted(
        '. Type /model to change.',
      )}`,
    );
  }

  setSteps(n: number) {
    this.stepsText.setText(
      `${theme.muted('Steps: ')}${theme.primary(String(n))}${theme.muted('. Type /steps <n> to change.')}`,
    );
  }
}
