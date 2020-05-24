;UNIT TESTS ROM
  
  .inesprg 2   ; 1x 16KB PRG code
  .ineschr 1   ; 1x  8KB CHR data
  .inesmap 0   ; mapper 0 = NROM, no bank swapping
  .inesmir 1   ; background mirroring
  
;NES specific hardware defines

PPU_CTRL_REG1         = $2000
PPU_CTRL_REG2         = $2001
PPU_STATUS            = $2002
PPU_SPR_ADDR          = $2003
PPU_SPR_DATA          = $2004
PPU_SCROLL_REG        = $2005
PPU_ADDRESS           = $2006
PPU_DATA              = $2007

SND_REGISTER          = $4000
SND_SQUARE1_REG       = $4000
SND_SQUARE2_REG       = $4004
SND_TRIANGLE_REG      = $4008
SND_NOISE_REG         = $400c
SND_DELTA_REG         = $4010
SND_MASTERCTRL_REG    = $4015

SPR_DMA               = $4014
JOYPAD_PORT           = $4016
JOYPAD_PORT1          = $4016
JOYPAD_PORT2          = $4017

; GAME SPECIFIC DEFINES

ObjectOffset          = $08

FrameCounter          = $C9

SavedJoypadBits       = $06fc
SavedJoypad1Bits      = $06fc
SavedJoypad2Bits      = $06fd
JoypadBitMask         = $074a
JoypadOverride        = $0758

A_B_Buttons           = $0a
PreviousA_B_Buttons   = $0d
Up_Down_Buttons       = $0b
Left_Right_Buttons    = $0c



GameEngineSubroutine  = $0e

Mirror_PPU_CTRL_REG1  = $0778
Mirror_PPU_CTRL_REG2  = $0779

OperMode              = $0770
OperMode_Task         = $0772
ScreenRoutineTask     = $073c

GamePauseStatus       = $0776
GamePauseTimer        = $0777

DemoAction            = $0717
DemoActionTimer       = $0718

TimerControl          = $0747
IntervalTimerControl  = $077f

Timers                = $0780
SelectTimer           = $0780
PlayerAnimTimer       = $0781
JumpSwimTimer         = $0782
RunningTimer          = $0783
BlockBounceTimer      = $0784
SideCollisionTimer    = $0785
JumpspringTimer       = $0786
GameTimerCtrlTimer    = $0787
ClimbSideTimer        = $0789
EnemyFrameTimer       = $078a
FrenzyEnemyTimer      = $078f
BowserFireBreathTimer = $0790
StompTimer            = $0791
AirBubbleTimer        = $0792
ScrollIntervalTimer   = $0795
EnemyIntervalTimer    = $0796
BrickCoinTimer        = $079d
InjuryTimer           = $079e
StarInvincibleTimer   = $079f
ScreenTimer           = $07a0
WorldEndTimer         = $07a1
DemoTimer             = $07a2


Sprite_Data           = $0200

Sprite_Y_Position     = $0200
Sprite_Tilenumber     = $0201
Sprite_Attributes     = $0202
Sprite_X_Position     = $0203

ScreenEdge_PageLoc    = $071a
ScreenEdge_X_Pos      = $071c
ScreenLeft_PageLoc    = $071a
ScreenRight_PageLoc   = $071b
ScreenLeft_X_Pos      = $071c
ScreenRight_X_Pos     = $071d

PlayerFacingDir       = $33
DestinationPageLoc    = $34
VictoryWalkControl    = $35
ScrollFractional      = $0768
PrimaryMsgCounter     = $0719
SecondaryMsgCounter   = $0749

HorizontalScroll      = $073f
VerticalScroll        = $0740
ScrollLock            = $0723
ScrollThirtyTwo       = $073d
Player_X_Scroll       = $06ff
Player_Pos_ForScroll  = $0755
ScrollAmount          = $0775

AreaData              = $e7
AreaDataLow           = $e7
AreaDataHigh          = $e8
EnemyData             = $e9
EnemyDataLow          = $e9
EnemyDataHigh         = $ea

AreaParserTaskNum     = $071f
ColumnSets            = $071e
CurrentPageLoc        = $0725
CurrentColumnPos      = $0726
BackloadingFlag       = $0728
BehindAreaParserFlag  = $0729
AreaObjectPageLoc     = $072a
AreaObjectPageSel     = $072b
AreaDataOffset        = $072c
AreaObjOffsetBuffer   = $072d
AreaObjectLength      = $0730
StaircaseControl      = $0734
AreaObjectHeight      = $0735
MushroomLedgeHalfLen  = $0736
EnemyDataOffset       = $0739
EnemyObjectPageLoc    = $073a
EnemyObjectPageSel    = $073b
MetatileBuffer        = $06a1
BlockBufferColumnPos  = $06a0
CurrentNTAddr_Low     = $0721
CurrentNTAddr_High    = $0720
AttributeBuffer       = $03f9

LoopCommand           = $0745

DisplayDigits         = $07d7
TopScoreDisplay       = $07d7
ScoreAndCoinDisplay   = $07dd
PlayerScoreDisplay    = $07dd
GameTimerDisplay      = $07f8
DigitModifier         = $0134

VerticalFlipFlag      = $0109
FloateyNum_Control    = $0110
ShellChainCounter     = $0125
FloateyNum_Timer      = $012c
FloateyNum_X_Pos      = $0117
FloateyNum_Y_Pos      = $011e
FlagpoleFNum_Y_Pos    = $010d
FlagpoleFNum_YMFDummy = $010e
FlagpoleScore         = $010f
FlagpoleCollisionYPos = $070f
StompChainCounter     = $0484

VRAM_Buffer1_Offset   = $0300
VRAM_Buffer1          = $0301
VRAM_Buffer2_Offset   = $0340
VRAM_Buffer2          = $0341
VRAM_Buffer_AddrCtrl  = $0773
Sprite0HitDetectFlag  = $0722
DisableScreenFlag     = $0774
DisableIntermediate   = $0769
ColorRotateOffset     = $06d4

TerrainControl        = $0727
AreaStyle             = $0733
ForegroundScenery     = $0741
BackgroundScenery     = $0742
CloudTypeOverride     = $0743
BackgroundColorCtrl   = $0744
AreaType              = $074e
AreaAddrsLOffset      = $074f
AreaPointer           = $0750

PlayerEntranceCtrl    = $0710
GameTimerSetting      = $0715
AltEntranceControl    = $0752
EntrancePage          = $0751
NumberOfPlayers       = $077a
WarpZoneControl       = $06d6
ChangeAreaTimer       = $06de

MultiLoopCorrectCntr  = $06d9
MultiLoopPassCntr     = $06da

FetchNewGameTimerFlag = $0757
GameTimerExpiredFlag  = $0759

PrimaryHardMode       = $076a
SecondaryHardMode     = $06cc
WorldSelectNumber     = $076b
WorldSelectEnableFlag = $07fc
ContinueWorld         = $07fd

CurrentPlayer         = $0753
PlayerSize            = $0754
PlayerStatus          = $0756


OnscreenPlayerInfo    = $075a
NumberofLives         = $075a ;used by current player
HalfwayPage           = $075b
LevelNumber           = $075c ;the actual dash number
Hidden1UpFlag         = $075d
CoinTally             = $075e
WorldNumber           = $075f
AreaNumber            = $0760 ;internal number used to find areas

CoinTallyFor1Ups      = $0748

OffscreenPlayerInfo   = $0761
OffScr_NumberofLives  = $0761 ;used by offscreen player
OffScr_HalfwayPage    = $0762
OffScr_LevelNumber    = $0763
OffScr_Hidden1UpFlag  = $0764
OffScr_CoinTally      = $0765
OffScr_WorldNumber    = $0766
OffScr_AreaNumber     = $0767

BalPlatformAlignment  = $03a0
Platform_X_Scroll     = $03a1
PlatformCollisionFlag = $03a2
YPlatformTopYPos      = $0401
YPlatformCenterYPos   = $58

BrickCoinTimerFlag    = $06bc
StarFlagTaskControl   = $0746

PseudoRandomBitReg    = $07a7
WarmBootValidation    = $07ff

SprShuffleAmtOffset   = $06e0
SprShuffleAmt         = $06e1
SprDataOffset         = $06e4
Player_SprDataOffset  = $06e4
Enemy_SprDataOffset   = $06e5
Block_SprDataOffset   = $06ec
Alt_SprDataOffset     = $06ec
Bubble_SprDataOffset  = $06ee
FBall_SprDataOffset   = $06f1
Misc_SprDataOffset    = $06f3
SprDataOffset_Ctrl    = $03ee

Player_State          = $1d
Enemy_State           = $1e
Fireball_State        = $24
Block_State           = $26
Misc_State            = $2a

Player_MovingDir      = $45
Enemy_MovingDir       = $46

SprObject_X_Speed     = $57
Player_X_Speed        = $57
Enemy_X_Speed         = $58
Fireball_X_Speed      = $5e
Block_X_Speed         = $60
Misc_X_Speed          = $64

Jumpspring_FixedYPos  = $58
JumpspringAnimCtrl    = $070e
JumpspringForce       = $06db

SprObject_PageLoc     = $6d
Player_PageLoc        = $6d
Enemy_PageLoc         = $6e
Fireball_PageLoc      = $74
Block_PageLoc         = $76
Misc_PageLoc          = $7a
Bubble_PageLoc        = $83

SprObject_X_Position  = $86   ;position in game's abstract map,
Player_X_Position     = $86   ;NOT the position on the screen
Enemy_X_Position      = $87
Fireball_X_Position   = $8d
Block_X_Position      = $8f
Misc_X_Position       = $93
Bubble_X_Position     = $9c

SprObject_Y_Speed     = $9f
Player_Y_Speed        = $9f
Enemy_Y_Speed         = $a0
Fireball_Y_Speed      = $a6
Block_Y_Speed         = $a8
Misc_Y_Speed          = $ac

SprObject_Y_HighPos   = $b5
Player_Y_HighPos      = $b5
Enemy_Y_HighPos       = $b6
Fireball_Y_HighPos    = $bc
Block_Y_HighPos       = $be
Misc_Y_HighPos        = $c2
Bubble_Y_HighPos      = $cb


SprObject_Y_Position  = $ce
Player_Y_Position     = $ce
Enemy_Y_Position      = $cf
Fireball_Y_Position   = $d5
Block_Y_Position      = $d7
Misc_Y_Position       = $db
Bubble_Y_Position     = $e4

SprObject_Rel_XPos    = $03ad  ;these represent the ACTUAL sprite positions
Player_Rel_XPos       = $03ad  ;on the screen
Enemy_Rel_XPos        = $03ae
Fireball_Rel_XPos     = $03af
Bubble_Rel_XPos       = $03b0
Block_Rel_XPos        = $03b1
Misc_Rel_XPos         = $03b3

SprObject_Rel_YPos    = $03b8
Player_Rel_YPos       = $03b8
Enemy_Rel_YPos        = $03b9
Fireball_Rel_YPos     = $03ba
Bubble_Rel_YPos       = $03bb
Block_Rel_YPos        = $03bc
Misc_Rel_YPos         = $03be

SprObject_SprAttrib   = $03c4
Player_SprAttrib      = $03c4
Enemy_SprAttrib       = $03c5

SprObject_X_MoveForce = $0400
Enemy_X_MoveForce     = $0401

SprObject_YMF_Dummy   = $0416
Player_YMF_Dummy      = $0416
Enemy_YMF_Dummy       = $0417
Bubble_YMF_Dummy      = $042c

SprObject_Y_MoveForce = $0433
Player_Y_MoveForce    = $0433
Enemy_Y_MoveForce     = $0434
Block_Y_MoveForce     = $043c

DisableCollisionDet   = $0716
Player_CollisionBits  = $0490
Enemy_CollisionBits   = $0491

SprObj_BoundBoxCtrl   = $0499
Player_BoundBoxCtrl   = $0499
Enemy_BoundBoxCtrl    = $049a
Fireball_BoundBoxCtrl = $04a0
Misc_BoundBoxCtrl     = $04a2

EnemyFrenzyBuffer     = $06cb
EnemyFrenzyQueue      = $06cd
Enemy_Flag            = $0f
Enemy_ID              = $16

PlayerGfxOffset       = $06d5
Player_XSpeedAbsolute = $0700
FrictionAdderHigh     = $0701
FrictionAdderLow      = $0702
RunningSpeed          = $0703
SwimmingFlag          = $0704
Player_X_MoveForce    = $0705
DiffToHaltJump        = $0706
JumpOrigin_Y_HighPos  = $0707
JumpOrigin_Y_Position = $0708
VerticalForce         = $0709
VerticalForceDown     = $070a
PlayerChangeSizeFlag  = $070b
PlayerAnimTimerSet    = $070c
PlayerAnimCtrl        = $070d
DeathMusicLoaded      = $0712
FlagpoleSoundQueue    = $0713
CrouchingFlag         = $0714
MaximumLeftSpeed      = $0450
MaximumRightSpeed     = $0456

SprObject_OffscrBits  = $03d0
Player_OffscreenBits  = $03d0
Enemy_OffscreenBits   = $03d1
FBall_OffscreenBits   = $03d2
Bubble_OffscreenBits  = $03d3
Block_OffscreenBits   = $03d4
Misc_OffscreenBits    = $03d6
EnemyOffscrBitsMasked = $03d8

Cannon_Offset         = $046a
Cannon_PageLoc        = $046b
Cannon_X_Position     = $0471
Cannon_Y_Position     = $0477
Cannon_Timer          = $047d

Whirlpool_Offset      = $046a
Whirlpool_PageLoc     = $046b
Whirlpool_LeftExtent  = $0471
Whirlpool_Length      = $0477
Whirlpool_Flag        = $047d

VineFlagOffset        = $0398
VineHeight            = $0399
VineObjOffset         = $039a
VineStart_Y_Position  = $039d

Block_Orig_YPos       = $03e4
Block_BBuf_Low        = $03e6
Block_Metatile        = $03e8
Block_PageLoc2        = $03ea
Block_RepFlag         = $03ec
Block_ResidualCounter = $03f0
Block_Orig_XPos       = $03f1



BoundingBox_UL_XPos   = $04ac
BoundingBox_UL_YPos   = $04ad
BoundingBox_DR_XPos   = $04ae
BoundingBox_DR_YPos   = $04af
BoundingBox_UL_Corner = $04ac
BoundingBox_LR_Corner = $04ae
EnemyBoundingBoxCoord = $04b0

PowerUpType           = $39

FireballBouncingFlag  = $3a
FireballCounter       = $06ce
FireballThrowingTimer = $0711

HammerEnemyOffset     = $06ae
JumpCoinMiscOffset    = $06b7

Block_Buffer_1        = $0500
Block_Buffer_2        = $05d0

HammerThrowingTimer   = $03a2
HammerBroJumpTimer    = $3c
Misc_Collision_Flag   = $06be

RedPTroopaOrigXPos    = $0401
RedPTroopaCenterYPos  = $58

XMovePrimaryCounter   = $a0
XMoveSecondaryCounter = $58

CheepCheepMoveMFlag   = $58
CheepCheepOrigYPos    = $0434
BitMFilter            = $06dd

LakituReappearTimer   = $06d1
LakituMoveSpeed       = $58
LakituMoveDirection   = $a0

FirebarSpinState_Low  = $58
FirebarSpinState_High = $a0
FirebarSpinSpeed      = $0388
FirebarSpinDirection  = $34

DuplicateObj_Offset   = $06cf
NumberofGroupEnemies  = $06d3

BlooperMoveCounter    = $a0
BlooperMoveSpeed      = $58

BowserBodyControls    = $0363
BowserFeetCounter     = $0364
BowserMovementSpeed   = $0365
BowserOrigXPos        = $0366
BowserFlameTimerCtrl  = $0367
BowserFront_Offset    = $0368
BridgeCollapseOffset  = $0369
BowserGfxFlag         = $036a
BowserHitPoints       = $0483
MaxRangeFromOrigin    = $06dc

BowserFlamePRandomOfs = $0417

PiranhaPlantUpYPos    = $0417
PiranhaPlantDownYPos  = $0434
PiranhaPlant_Y_Speed  = $58
PiranhaPlant_MoveFlag = $a0

FireworksCounter      = $06d7
ExplosionGfxCounter   = $58
ExplosionTimerCounter = $a0

;sound related defines
Squ2_NoteLenBuffer    = $07b3
Squ2_NoteLenCounter   = $07b4
Squ2_EnvelopeDataCtrl = $07b5
Squ1_NoteLenCounter   = $07b6
Squ1_EnvelopeDataCtrl = $07b7
Tri_NoteLenBuffer     = $07b8
Tri_NoteLenCounter    = $07b9
Noise_BeatLenCounter  = $07ba
Squ1_SfxLenCounter    = $07bb
Squ2_SfxLenCounter    = $07bd
Sfx_SecondaryCounter  = $07be
Noise_SfxLenCounter   = $07bf

PauseSoundQueue       = $fa
Square1SoundQueue     = $ff
Square2SoundQueue     = $fe
NoiseSoundQueue       = $fd
AreaMusicQueue        = $fb
EventMusicQueue       = $fc

Square1SoundBuffer    = $f1
Square2SoundBuffer    = $f2
NoiseSoundBuffer      = $f3
AreaMusicBuffer       = $f4
EventMusicBuffer      = $07b1
PauseSoundBuffer      = $07b2

MusicData             = $f5
MusicDataLow          = $f5
MusicDataHigh         = $f6
MusicOffset_Square2   = $f7
MusicOffset_Square1   = $f8
MusicOffset_Triangle  = $f9
MusicOffset_Noise     = $07b0

NoteLenLookupTblOfs   = $f0
DAC_Counter           = $07c0
NoiseDataLoopbackOfs  = $07c1
NoteLengthTblAdder    = $07c4
AreaMusicBuffer_Alt   = $07c5
PauseModeFlag         = $07c6
GroundMusicHeaderOfs  = $07c7
AltRegContentFlag     = $07ca

;sound effects constants
Sfx_SmallJump         = %10000000
Sfx_Flagpole          = %01000000
Sfx_Fireball          = %00100000
Sfx_PipeDown_Injury   = %00010000
Sfx_EnemySmack        = %00001000
Sfx_EnemyStomp        = %00000100
Sfx_Bump              = %00000010
Sfx_BigJump           = %00000001

Sfx_BowserFall        = %10000000
Sfx_ExtraLife         = %01000000
Sfx_PowerUpGrab       = %00100000
Sfx_TimerTick         = %00010000
Sfx_Blast             = %00001000
Sfx_GrowVine          = %00000100
Sfx_GrowPowerUp       = %00000010
Sfx_CoinGrab          = %00000001

Sfx_BowserFlame       = %00000010
Sfx_BrickShatter      = %00000001

;music constants
Silence               = %10000000

StarPowerMusic        = %01000000
PipeIntroMusic        = %00100000
CloudMusic            = %00010000
CastleMusic           = %00001000
UndergroundMusic      = %00000100
WaterMusic            = %00000010
GroundMusic           = %00000001

TimeRunningOutMusic   = %01000000
EndOfLevelMusic       = %00100000
AltGameOverMusic      = %00010000
EndOfCastleMusic      = %00001000
VictoryMusic          = %00000100
GameOverMusic         = %00000010
DeathMusic            = %00000001


;enemy object constants 
GreenKoopa            = $00
BuzzyBeetle           = $02
RedKoopa              = $03
HammerBro             = $05
Goomba                = $06
Bloober               = $07
BulletBill_FrenzyVar  = $08
GreyCheepCheep        = $0a
RedCheepCheep         = $0b
Podoboo               = $0c
PiranhaPlant          = $0d
GreenParatroopaJump   = $0e
RedParatroopa         = $0f
GreenParatroopaFly    = $10
Lakitu                = $11
Spiny                 = $12
FlyCheepCheepFrenzy   = $14
FlyingCheepCheep      = $14
BowserFlame           = $15
Fireworks             = $16
BBill_CCheep_Frenzy   = $17
Stop_Frenzy           = $18
Bowser                = $2d
PowerUpObject         = $2e
VineObject            = $2f
FlagpoleFlagObject    = $30
StarFlagObject        = $31
JumpspringObject      = $32
BulletBill_CannonVar  = $33
RetainerObject        = $35
TallEnemy             = $09

;other constants
World1 = 0
World2 = 1
World3 = 2
World4 = 3
World5 = 4
World6 = 5
World7 = 6
World8 = 7
Level1 = 0
Level2 = 1
Level3 = 2
Level4 = 3

; WarmBootOffset        = LOW($07d6)
; ColdBootOffset        = LOW($07fe)
TitleScreenDataOffset = $1EC0
SoundMemory           = $07b0
SwimTileRepOffset     = $EEB5		;;PlayerGraphicsTable + $9e
MusicHeaderOffsetData = $F90C 		;;MusicHeaderData - 1
MHD                   = $F90D		;;MusicHeaderData

A_Button              = %10000000
B_Button              = %01000000
Select_Button         = %00100000
Start_Button          = %00010000
Up_Dir                = %00001000
Down_Dir              = %00000100
Left_Dir              = %00000010
Right_Dir             = %00000001

TitleScreenModeValue  = 0
GameModeValue         = 1
VictoryModeValue      = 2
GameOverModeValue     = 3

myaddress = $AB
myaddress2 = $CC





;----------------------------------------

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
realscore    .rs 1 ;score 10's place
gravity     .rs 1
jumpcounter .rs 1 ;how long to jump for
jumpspeed   .rs 1 ;has to be greater than gravity
; myaddress   .rs 1

  .bank 0
  .org $8000 
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
  LDA #20
  STA $300
   
vblankwait2:      ; Second wait for vblank, PPU is ready after this
  BIT $2002
  BPL vblankwait2


LoadPalettes:
  LDA $2002             ; read PPU status to reset the high/low latch
  LDA #$3F
  STA $2006             ; write the high byte of $3F00 address
  LDA #$00
  STA $2006             ; write the low byte of $3F00 address
  LDX #$00              ; start out at 0
LoadPalettesLoop:
  LDA palette, x        ; load data from address (palette + the value in x)
                          ; 1st time through loop it will load palette+0
                          ; 2nd time through loop it will load palette+1
                          ; 3rd time through loop it will load palette+2
                          ; etc
  STA $2007             ; write to PPU
  INX                   ; X = X + 1
  CPX #$20              ; Compare X to hex $10, decimal 16 - copying 16 bytes = 4 sprites
  BNE LoadPalettesLoop  ; Branch to LoadPalettesLoop if compare was Not Equal to zero
                        ; if compare was equal to 32, keep going down


;;;Set some initial ship stats
  LDA #100
  STA shipy
  LDA #120
  STA shipx

;enemy
  LDA #$FE
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

  LDA #$FE
  STA myaddress


;gravity
    LDA #1
    STA gravity
    LDA #0
    STA jumpcounter
    LDA #2
    STA jumpspeed

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

CannonBitmasks:
       .db %00001111, %00000111
       
MySub2:
    ORA nametable
    RTS

MySub:
    LDA #30
    RTS
    .dw MySub2


;UNIT TESTS

UnitTests:
    
    ;test0 - BuzzyBeetle is an address which = $02 but doing #BuzzyBeetle
    ;        should load the value $02 not whats at the address $02
    LDA #BuzzyBeetle
    STA $400

    ;test1 - VRAMTableLow is a .db list, this tests loading the the second
    ;        value using x offset
    LDX #1
    LDA VRAMTableLow, x 
    STA $401

    ;test2 - tests loading the value $14 as hex rather than what's at the address $14
    LDA #$14
    STA $402

    ;test3 - tests loading the value 14 as a decimal rather than in hex
    LDA #14
    STA $403

    ;test4 - tests inderirect addressing using Zero Page Y offset
    ;        the value 30 is stored at Zero Page memory location $FE
    ;        and myaddress has a value of $FE so doing indirect
    ;        memory addressing should load the value 30 
    ;        from address $FE
    LDA #30
    STA $FE
    LDY #0
    LDA [myaddress], y
    STA $404

    ;test5 - test constants having underscores
    LDA #$12
    STA PreviousA_B_Buttons
    LDA PreviousA_B_Buttons
    STA $405

    ;test 6 and 7 - test LOW_myname,HIGH_myname as modifiers to a label
    LDX #2
    LDA VRAMTableLow, x 
    STA $406
    LDX #3
    LDA VRAMTableLow, x 
    STA $407

    ;test 8 read a value from a .db array
    LDA myname
    STA $408

    ;test 9 add/subtract modifier with label
    LDA myname+1
    STA $409

    ;test 10 add/subtract modifier with constant
    ;PowerUpType = $39
    LDA #$15
    STA $3A
    LDA PowerUpType+1
    STA $40A


    ;test 11 - test .dw places correct bytes
    LDA MySub+3
    STA $DD
    LDA MySub+4
    STA $DE
    LDY #0
    LDA [$DD],y
    STA $40B


    ;test 12 and 13 - High Low Modifiers of a constant
    LDX #4
    LDA VRAMTableLow, x 
    STA $40C
    LDX #5
    LDA VRAMTableLow, x 
    STA $40D

    ;test 14 - constants that are decimal arguments
    LDA #World4
    STA $40E

    ;test 15 - #LOW modifier
    LDA #LOW(SND_MASTERCTRL_REG)
    STA $40F

    ;test 16 - #LOW modifier
    LDA #HIGH(SND_MASTERCTRL_REG)
    STA $410

    ;test 17 - indirect jump
    ;will be equivelant to jmp [$CC] in nesasm but the .dw and y register is necessary
    ;as a hack for my compiler. side effect is that there will be an extra 0 byte tacked on
    ;but in smb should not matter because the jmp will move the program counter elsewhere.
    ;In this example it should just jump to the PrintTest Label down below. The opcode will
    ;actually be a JMP Indirect, not a JMP Indirect Y which actually doesn't exist as an opcode
    ;UPDATE - i fixed it so now it can be a .db instead of a .dw (takes up 1 byte vs 2)
    LDA #LOW(PrintTest)
    STA $CC
    LDA #HIGH(PrintTest)
    STA $CD
    JMP [$CC],y
    .db $0
    ;NESASM VERSION
    ; JMP [$CC]
   
PrintTest:

    LDA #4
    STA $411
    
    ;test 18 - another indirect addressing test just to be sure
    LDA #6
    STA $E7
    LDY #0
    lda [AreaData],y
    STA $412

    ;test 19 - store to indirect addressing with y offset
    LDA #$29
    STA $28
    LDY #0
    LDA #9
    sta [$28],y
    LDA $29
    STA $413

    ;test 20 and 21 - binary constants
    LDA #129
    AND #A_Button
    STA $414
    LDA #A_Button
    STA $415

    ;test 22 - binary constant as part of a .db list
    LDX #8
    LDA VRAMTableLow,x
    STA $416

    
    ;test 23 and 24 test .db to just place single bytes
    .db $a9,$40    
    STA $417
    LDA singledb
    STA $418

    ;test 25 - get constant from a .db array
    LDY #3
    LDA BowserIdentities,y     ;get enemy identifier to replace bowser with
    STA $419

    ;test 26 - allow < character
    LDA #$12
    STA $FA
    lda <PauseSoundQueue       ;if not, check pause sfx queue    
    sta $41A

    ;test 27 - allow < character in addresses
    LDA #17
    sta $41B
    sta <$41

    ;test 28 - allow add/substract with y addressing
    LDY #0
    LDA BowserIdentities+2,y
    STA $41C

    ;test 29 - fixed LDA with Absolute Y Offset
    LDA #$40
    STA $34
    LDY #1
    LDA PlayerFacingDir,y
    STA $41D


    ;test 30
    LDA CannonBitmasks+1
    STA $41E

    ; LDA Enemy_ID,y
    ; ORA Enemy_State,y
    ; STA Enemy_Y_Speed,y

    ; LDA $13,y

    ; lda Enemy_ID,y

    ; LDA #$07  ;start on the eighth row
    ; .db $2c   ;BIT instruction opcode
    
    
    ; LDX #3
    ; LDA MySub,x
    ; STA realscore

    ; LDX #0
    ; LDA MySub,x ;should be 0C
    ; STA realscore


    ; LDA SM_URF-0
    ; STA realscore


    RTS




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
;   INC scroll       ; add one to our scroll variable each frame
;   LDA scroll
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
  ;JSR UpdateEnemy
  JSR CheckEnemyCollision
  JSR ProcessGravity
  JSR UpdateSprites
  JSR UnitTests



  RTI             ; return from interrupt

ConvertScore:
  LDA realscore
  AND #%00001111
  STA score1

  LDA realscore
  AND #%11110000
  LSR A
  LSR A
  LSR A
  LSR A
  STA score10 
  RTS
    
UpdateScore:
  LDA $2002             ; read PPU status to reset the high/low latch

  LDA #$21               ;writing to first tile of nametable
  STA $2006             ; write the high byte of column address
  LDA #$59
  STA $2006             ; write the low byte of column address

  LDA score10
  STA $2007
  LDA score1
  STA $2007

  RTS

ProcessGravity:
    LDA shipy
    CLC
    ADC gravity
    STA shipy

    ;process jumping
    LDA jumpcounter
    BEQ CheckGround
    LDA shipy
    SEC
    SBC jumpspeed
    STA shipy
    DEC jumpcounter


    CheckGround:
    ;check if player hit ground
    LDA shipy
    CMP #215
    BCC NotHitGround
    LDA #215
    STA shipy
    NotHitGround:
    
    RTS


UpdateEnemy:

  DEC enemyx
  LDA enemyx

  BNE SkipEnemyUpdate
    JSR NEXTRND
    LDA random

    ;divide by two and add 50 to end up in the range of 50-178
    LSR A 
    CLC
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
  INC score1
  LDA score1
  CMP #10         ;if score==10 increase score10 set score1 back to 0
  BNE NoCollision
  LDA #0
  STA score1
  INC score10

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
  LDA #32  ;white background
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
  AND #1
  BEQ NotPressedB
    LDA #20
    STA jumpcounter
  NotPressedB:
  LDA $4016     ; player 1 - Select
  LDA $4016     ; player 1 - Start
  LDA $4016     ; player 1 - Up
  AND #1
  BEQ NotPressedUp
    ; DEC shipy
  NotPressedUp:
  LDA $4016     ; player 1 - Down
  AND #1
  BEQ NotPressedDown
    ; INC shipy
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
  CPX #12                ; size of db
  BNE LoadNameLoop    ; Branch to LoadPalettesLoop if compare was Not Equal to zero
                          ; if compare was equal to 32, keep going down
  RTS
  
  




palette:
    ;neil - change second byte of background palette to see something change
  .db $02,$26,$2A,$2F,  $12,$16,$27,$2F,  $22,$30,$21,$0F,  $22,$27,$17,$0F   ;;background palette
  .db $22,$1C,$15,$14,  $22,$02,$38,$3C,  $22,$1C,$15,$14,  $22,$02,$38,$3C   ;;sprite palette


sprites:
     ;vert tile attr horiz
  .db $80, $32, $00, $80   ;sprite 0
  .db $80, $33, $00, $88   ;sprite 1
  .db $88, $34, $00, $80   ;sprite 2
  .db $88, $35, $00, $88   ;sprite 3



myname:
  .db $23,$14,$18,$21,$36,$18,$28,$36,$12,$24,$24,$21

singledb:
    .db $2c

BowserIdentities:
      .db Goomba, GreenKoopa, BuzzyBeetle, Spiny, Lakitu, Bloober, HammerBro, Bowser

VRAMTableLow:
  .db $15,$20,LOW_myname,HIGH_myname,LOW_SPR_DMA,HIGH_SPR_DMA  
  ;NESASM VERSION
  ;.db $15,$20,LOW(myname),HIGH(myname),LOW(SPR_DMA),HIGH(SPR_DMA)
  .db A_Button,GameOverMusic,B_Button

L_CastleArea6:
      .db $5b, $06
      .db $05, $32, $06, $33, $07, $34, $5e, $0a, $ae, $02
      .db $0d, $01, $39, $73, $0d, $03, $39, $7b, $4d, $4b
      .db $de, $06, $1e, $8a, $ae, $06, $c4, $33, $16, $fe


AreaDataAddrHigh:
      .db $20, HIGH_L_CastleArea6, $30

VRAMTableLow2:
  .db $30,$40

  .org $FFFA     ;first of the three vectors starts here
  .dw NMI        ;when an NMI happens (once per frame if enabled) the 
                   ;processor will jump to the label NMI:
  .dw RESET      ;when the processor first turns on or is reset, it will jump
                   ;to the label RESET:
  .dw 0          ;external interrupt IRQ is not used in this tutorial 
  
  
;;;;;;;;;;;;;;  
  
  
  .incbin "alternate.chr"