  .inesprg 1   ; 1x 16KB PRG code
  .ineschr 1   ; 1x  8KB CHR data
  .inesmap 0   ; mapper 0 = NROM, no bank swapping
  .inesmir 1   ; background mirroring
  
  .rsset $0000  ;;start variables at ram location 0
  
gamestate  .rs 1  ; .rs 1 means reserve one byte of space
shipx      .rs 1  ; ship horizontal position
shipy      .rs 1  ; ship vertical position
scroll     .rs 1  ; horizontal scroll count
nametable  .rs 1  ; which nametable to draw first
bouncedir  .rs 1  ; is ship going up or down
random     .rs 1  ; random number generator
enemyx     .rs 1  ; enemy horizontal position
enemyy     .rs 1  ; enemy vertical position
enemycounter  .rs 1 ;interval to update enemy position
bulletx    .rs 1
bullety    .rs 1
score1     .rs 1 ;score 1's place
score10    .rs 1 ;score 10's place
score100   .rs 1 ;score 100's place
realscore    .rs 1 ;score 10's place
scorecounter    .rs 1 ;score 10's place


  .bank 0
  .org $C000 
RESET:
  SEI          ; disable IRQs
  CLD          ; disable decimal mode
  LDX #$40
  STX $4017    ; disable APU frame IRQ
  LDX #$FF
  TXS          ; Set up stack
  INX          ; now X = 0
  STX $2000    ; disable NMI
  STX $2001    ; disable rendering
  STX $4010    ; disable DMC IRQs

vblankwait1:       ; First wait for vblank to make sure PPU is ready
  BIT $2002
  BPL vblankwait1

clrmem:
  LDA #0
  STA $0000, x
  STA $0100, x
  STA $0300, x
  STA $0400, x
  STA $0500, x
  STA $0600, x
  STA $0700, x
  LDA #$FE
  STA $0200, x
  INX
  BNE clrmem
   
vblankwait2:      ; Second wait for vblank, PPU is ready after this
  BIT $2002
  BPL vblankwait2

;;;Set some initial ship stats
  LDA #100
  STA shipy
  LDA #120
  STA shipx

;enemy
  LDA #150
  STA enemyy
  LDA #170
  STA enemyx

  LDA #0
  STA enemycounter

;bullet
  LDA #0
  STA bulletx
  LDA #$FE ;makes it off screen
  STA bullety

;start scroll at 0
  LDA #0
  STA scroll

;score
  LDA #123
  CLC
  ADC #31
  STA realscore



;set initial nametable to 0
  LDA #0
  STA nametable

  LDA #0
  STA bouncedir

;random seed
;TODO set this second time when player first shoots
  LDA #27
  STA random
  

  ;must be set up before re-enabling NMI
  ;otherwise it won't have time to finish
  ;rendering the background
  JSR UpdateBackground 
  JSR UpdateBackground2
  JSR UpdateBackgroundName


;my own palette
  JSR SetColors

;enable nmi
  JSR SetNameTable


Forever:
  JMP Forever     ;jump back to Forever, infinite loop, waiting for NMI
  
 
 ;GAME LAYOUT
 ;Init Code -> Infinite Loop -> NMI -> Graphics Updates -> Read Buttons -> Game Engine --\
 ;                   ^                                                                    |
 ;                    \------------------------------------------------------------------/

NMI:

    
  ;OAM and nametable updates have to finish before scanline 0
  LDA #$02
  STA $4014       ; set the high byte (02) of the RAM address, start OAM transfer

  ;do any nametable changes here - last chance before PPU Cleanup
  JSR ConvertScore
  JSR UpdateScore 
    



  ;PPU CLEANUP SECTION
  LDA #$00
  STA $2006        ; clean up PPU address registers
  STA $2006
  LDA #%00011110   ; enable sprites, enable background, no clipping on left side
  STA $2001
  ;do scrolling 
  INC scroll       ; add one to our scroll variable each frame
  LDA scroll
  BNE SwapNameTablesCheck
    JSR SwapNameTables
  SwapNameTablesCheck:
  LDA scroll
  STA $2005    
  LDA #$00         ; no vertical scrolling
  STA $2005
  JSR SetNameTable
  ;TODO not sure if i'm setting these registers in the correct order



  ;all graphics updates done by this point, now run game engine
  
  

  GameEngine:
  JSR ControllerCheck
  JSR ProcessBullet
  JSR ProcessBullet
  JSR UpdateEnemy
  JSR CheckEnemyCollision
  JSR UpdateSprites  

  


  RTI             ; return from interrupt

ConvertScore:
;routine to get realscore in hex
;   LDA realscore
;   AND #%00001111
;   STA score1
;   LDA realscore
;   AND #%11110000
;   LSR A
;   LSR A
;   LSR A
;   LSR A
;   STA score10 

;routine to get realscore in decimal
    LDA #0
    STA score1
    STA score10
    STA score100
    LDA realscore
    STA scorecounter
    ScoreLoop:
        LDA scorecounter
        BEQ FinishScore
        DEC scorecounter
        INC score1
        LDA score1
        CMP #10
        BNE ScoreLoop
        LDA #0
        STA score1
        INC score10
        LDA score10
        CMP #10
        BNE ScoreLoop
        LDA #0
        STA score10
        INC score100
        JMP ScoreLoop
    FinishScore:
  RTS
    
UpdateScore:
  LDA $2002             ; read PPU status to reset the high/low latch

  LDA #$22               ;writing to first tile of nametable
  STA $2006             ; write the high byte of column address
  LDA #$4D
  STA $2006             ; write the low byte of column address

  LDA score100
  STA $2007
  LDA score10
  STA $2007
  LDA score1
  STA $2007

  RTS

UpdateEnemy:

  DEC enemyx
  LDA enemyx

  BNE SkipEnemyUpdate
    JSR NEXTRND
    LDA random

    ;divide by two and add 50 to end up in the range of 50-178
    LSR A 
    ADC #50 
    STA enemyy

    ;prevent enemy animation from jumping during the 1 frame
    LDA #255
    STA enemyx
  SkipEnemyUpdate:


  RTS
  
CheckEnemyCollision:

  ;only do collision check is bullet is active
  LDA bullety
  CMP #$FE
  BEQ NoCollision

  ;compare x coordinate
  LDA bulletx
  CMP enemyx
  BCC NoCollision
  LDA enemyx
  CLC
  ADC #10
  CMP bulletx
  BCC NoCollision

  ;compare y coordinate
  LDA bullety
  CLC
  ADC #6
  CMP enemyy
  BCC NoCollision
  LDA enemyy
  CLC
  ADC #8
  CMP bullety
  BCC NoCollision
  

  ;if there was a hit
  LDA #$FE
  STA enemyy
  STA bullety

  ;update score
  ; INC score1
  ; LDA score1
  ; CMP #10         ;if score==10 increase score10 set score1 back to 0
  ; BNE NoCollision
  ; LDA #0
  ; STA score1
  ; INC score10
  INC realscore

  NoCollision:

RTS

ProcessBullet:

  LDA bullety
  CMP #$FE
  BEQ SkipBullet
    INC bulletx
    LDA bulletx
    CMP #$FF
    BNE SkipBullet ;if it's reached the end then move it off screen
    LDA #$FE
    STA bullety
  SkipBullet:

  RTS


SetColors:
  LDA $2002    ; read PPU status to reset the high/low latch to high

  ;background colors
  LDA #$3F
  STA $2006    ; write the high byte of $3F10 address
  LDA #$00
  STA $2006    ; write the low byte of $3F10 address
  LDA #$3C  ;blue background
  STA $2007  
  ; LDA #53   ;pink
  LDA #40   ;green
  STA $2007  
  ; LDA #32   ;white
  LDA #39   ;brown
  STA $2007  
  LDA #47   ;black
  STA $2007  

  ;ship color
  LDA #$3F
  STA $2006    ; write the high byte of $3F10 address
  LDA #$11
  STA $2006    ; write the low byte of $3F10 address
  LDA #21   ;red - enemy
  STA $2007  
  LDA #33   ;light blue
  STA $2007  
  LDA #18   ;dark blue
  STA $2007  


  RTS

SwapNameTables:
  LDA nametable         ; load current nametable number (0 or 1)
  EOR #$01              ; exclusive OR of bit 0 will flip that bit
  STA nametable         ; so if nametable was 0, now 1
                        ;    if nametable was 1, now 0
  ; BNE CLCCheck
  ;   CLC
  ; CLCCheck:
  RTS

SetNameTable:
  LDA #%10010000   ; enable NMI, sprites from Pattern Table 0, background from Pattern Table 1
  ORA nametable    ; select correct nametable for bit 0
  STA $2000
  RTS

ControllerCheck:
  LDA #1
  STA $4016
  LDA #0
  STA $4016     ; tell both the controllers to latch buttons

  LDA $4016     ; player 1 - A
  AND #1
  BEQ NotPressedA
    LDA shipy
    STA bullety
    LDA shipx
    STA bulletx
  NotPressedA:
  LDA $4016     ; player 1 - B
  LDA $4016     ; player 1 - Select
  LDA $4016     ; player 1 - Start
  LDA $4016     ; player 1 - Up
  AND #1
  BEQ NotPressedUp
    DEC shipy
  NotPressedUp:
  LDA $4016     ; player 1 - Down
  AND #1
  BEQ NotPressedDown
    INC shipy
  NotPressedDown:
  LDA $4016     ; player 1 - Left
  AND #1
  BEQ NotPressedLeft
    DEC shipx
  NotPressedLeft:
  LDA $4016     ; player 1 - Right
  AND #1
  BEQ NotPressedRight
    INC shipx
  NotPressedRight:
  RTS

;Random Number Generator
NEXTRND:
    LDA random
    ASL A        ; A = RND * 2
    ASL A        ; A = RND * 4
    CLC
    ADC random      ; A = RND * 5
    CLC
    ADC #17      ; A = RND * 5 + 17
    STA random
    
    RTS
    
UpdateSprites:


  ; BallCheckHigh:
  ; LDA shipy
  ; CMP #38
  ; BNE BallCheckLow
  ; LDA #0
  ; STA bouncedir
  ; JMP BounceStage

  ; BallCheckLow:
  ; CMP #216
  ; BNE BounceStage 
  ; LDA #1
  ; STA bouncedir

  ; BounceStage:
  ; LDA bouncedir
  ; BNE BounceUp    ;if
  ;   INC shipy
  ;   JMP FinishBounce
  ; BounceUp:       ;else
  ;   DEC shipy
  ; FinishBounce:   ;endif

  
  ; ship oam
  LDA shipy  
  STA $0200
  LDA #117
  STA $0201
  LDA #$00
  STA $0202
  LDA shipx
  STA $0203 

  ; enemy oam
  LDA enemyy  
  STA $0204
  LDA #240
  STA $0205
  LDA #$00
  STA $0206
  LDA enemyx
  STA $0207 

  ; bullet oam
  LDA bullety  
  STA $0208
  LDA #116
  STA $0209
  LDA #$00
  STA $020A
  LDA bulletx
  STA $020B
  
  ;;update paddle sprites
  RTS

UpdateBackground:
  LDA $2002             ; read PPU status to reset the high/low latch

  ;NAMETABLE 1
  LDA #$20               ;writing to first tile of nametable
  STA $2006             ; write the high byte of column address
  LDA #$00
  STA $2006             ; write the low byte of column address
  ; loop Y for 28 times
  ; loop X for 32 times
  LDY #30                   
MyLoopY:
  LDX #32                   
MyLoopX:
  LDA #75    
  CPY #2
  BEQ GroundTile
  CPY #1
  BEQ GroundTile
    LDA #36
  GroundTile:  
  STA $2007
  DEX 
  BNE MyLoopX
  DEY
  BNE MyLoopY

  ;NAMETABLE 2
  LDA #$24               ;writing to first tile of nametable
  STA $2006             ; write the high byte of column address
  LDA #$00
  STA $2006             ; write the low byte of column address
  ; loop Y for 28 times
  ; loop X for 32 times
  LDY #30                   
MyLoopY3:
  LDX #32                   
MyLoopX3:
  LDA #75    
  CPY #2
  BEQ GroundTile2
  CPY #1
  BEQ GroundTile2
    LDA #36
  GroundTile2:       
  STA $2007
  DEX 
  BNE MyLoopX3
  DEY
  BNE MyLoopY3

  
  RTS

UpdateBackground2:
  LDA $2002             ; read PPU status to reset the high/low latch

  ;NAMETABLE1
  LDA #$20               ;writing to first tile of nametable
  STA $2006             ; write the high byte of column address
  LDA #$00
  STA $2006             ; write the low byte of column address
  ; loop Y for 28 times
  ; loop X for 32 times
  LDY #5                   
MyLoopY2:
  LDX #32                  
MyLoopX2:
  LDA #71        
  STA $2007
  DEX 
  BNE MyLoopX2
  DEY
  BNE MyLoopY2

  ;NAMETABLE 2
  LDA #$24               ;writing to first tile of nametable
  STA $2006             ; write the high byte of column address
  LDA #$00
  STA $2006             ; write the low byte of column address
  ; loop Y for 28 times
  ; loop X for 32 times
  LDY #5                   
MyLoopY4:
  LDX #32                  
MyLoopX4:
  LDA #71        
  STA $2007
  DEX 
  BNE MyLoopX4
  DEY
  BNE MyLoopY4

  RTS

UpdateBackgroundName:
  LDA $2002             ; read PPU status to reset the high/low latch

  LDA #$26               ;writing to first tile of nametable
  STA $2006             ; write the high byte of column address
  LDA #$08
  STA $2006             ; write the low byte of column address

  LDX #0                ; start out at 0
  LoadNameLoop:
  LDA myname, x      ; load data from address (PaletteData + the value in x)
                          ; 1st time through loop it will load PaletteData+0
                          ; 2nd time through loop it will load PaletteData+1
                          ; 3rd time through loop it will load PaletteData+2
                          ; etc
  STA $2007               ; write to PPU
  INX                     ; X = X + 1
  CPX #11                ; size of db
  BNE LoadNameLoop    ; Branch to LoadPalettesLoop if compare was Not Equal to zero
                          ; if compare was equal to 32, keep going down
  RTS
  
  
  .bank 1
  .org $E000

myname:
  .db $17,$0e,$1c,$24,$12,$1c,$24,$0c,$18,$18,$15 ;NES IS COOL in hex



  .org $FFFA     ;first of the three vectors starts here
  .dw NMI        ;when an NMI happens (once per frame if enabled) the 
                   ;processor will jump to the label NMI:
  .dw RESET      ;when the processor first turns on or is reset, it will jump
                   ;to the label RESET:
  .dw 0          ;external interrupt IRQ is not used in this tutorial
  
  
;;;;;;;;;;;;;;  
  
  
  .bank 2
  .org $0000
  .incbin "alternate.chr"