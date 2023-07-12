import { Notification } from "electron";

export function notify(message:string ,title:string = __filename) {
    new Notification(
        {
            title,
            body:message,
        }
    ).show();
}