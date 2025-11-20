import { _decorator, Component, Node } from 'cc';
const { ccclass, property } = _decorator;



export class AppLovinEvent  {
    
    //Loading and display events
    static LOADING : string = "LOADING";
    static LOADED : string = "LOADED";
    static DISPLAYED : string = "DISPLAYED";
    

    //Challenge events
    static CHALLENGE_STARTED : string = "CHALLENGE_STARTED";
    static CHALLENGE_FAILED : string = "CHALLENGE_FAILED";
    static CHALLENGE_RETRY : string = "CHALLENGE_RETRY";
    static CHALLENGE_PASS_25 : string = "CHALLENGE_PASS_25";
    static CHALLENGE_PASS_50 : string = "CHALLENGE_PASS_50";
    static CHALLENGE_PASS_75 : string = "CHALLENGE_PASS_75";
    static CHALLENGE_SOLVED : string = "CHALLENGE_SOLVED";

    //Completion and conversion events
    static COMPLETED : string = "COMPLETED";
    static CTA_CLICKED : string = "CTA_CLICKED";
    static ENDCARD_SHOWN : string = "ENDCARD_SHOWN";


    public static SendEvent(eventName: string) {
        if (window["ALPlayableAnalytics "]) {
            window["ALPlayableAnalytics "].trackEvent(eventName);
        }
    }


}


