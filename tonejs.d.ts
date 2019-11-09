export interface ToneJS{
    frequency:ToneJSProperty;
    volume:ToneJSProperty;
    width:ToneJSProperty;
    state:string;
    phase:number;
    mute:boolean;
    toDestination():void;
    toMaster():void;
    start():void;
    connect(any):void;
}

export interface ToneJSProperty{
    value:number;
}