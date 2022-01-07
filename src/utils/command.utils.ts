export class CommandUtils {

    static getCommandPrefix(commandString: string): string {
        const parts = commandString.split(' ');
        return parts.length > 0 ? parts[0] : '';
    }
}