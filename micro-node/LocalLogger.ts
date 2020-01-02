import chalk from "chalk";

class LocalLogger {
    tags: string[] = [];
    statusChars: StatusChars;

    constructor(
        statusChars: StatusChars | null = {
            success: "+",
            info: "?",
            warning: "!",
            error: "-"
        }
    ) {
        this.statusChars = statusChars;
    }

    log(statusChar: string, message: any): void {
        console.log(`[${statusChar}]`, ...this.tags.map(tag => `[${tag}]`), ...message);
    }

    tag(tag: string): LocalLogger {
        const child = new LocalLogger({ ...this.statusChars });
        child.tags = [...this.tags, tag];
        return child;
    }

    success(...message: any) {
        this.log(chalk.green(this.statusChars.success), message);
    }

    info(...message: any) {
        this.log(chalk.blue(this.statusChars.info), message);
    }

    warning(...message: any) {
        this.log(chalk.yellow(this.statusChars.warning), message);
    }

    error(...message: any) {
        this.log(chalk.red(this.statusChars.error), message);
    }
}

interface StatusChars {
    success: string;
    info: string;
    warning: string;
    error: string;
}

export { LocalLogger };
