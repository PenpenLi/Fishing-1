import global from "../global";
import Utils from "./../Utils";
import BulletList from "./Bullet/BulletList";
import Bullet from "./Bullet/Bullet";
import Fish from "./Fish/Fish";
import FishList from "./Fish/FishList";
import {FishType} from "./Fish/FishType";
import Net from "./Net/Net";
const {ccclass, property} = cc._decorator;

@ccclass
export default class GameScene extends cc.Component {

    @property(cc.Node)
    mainNode: cc.Node = null;
    @property([cc.Node])
    seatList: cc.Node[] = [];
    @property(cc.Prefab)
    paoTaiPrefab: cc.Prefab = null;
    @property(cc.Prefab)
    bulletPrefab: cc.Prefab = null;
    @property(cc.Prefab)
    fishPrefab: cc.Prefab = null;
    @property(cc.Prefab)
    netPrefab: cc.Prefab = null;
    @property(cc.SpriteAtlas)
    bulletAtlas: cc.SpriteAtlas = null;
    @property(cc.SpriteAtlas)
    fishAtlas: cc.SpriteAtlas = null;
    


    fishTypes: FishType[];
    fishRoot: cc.Node;
    netPool: cc.NodePool;
    mySeat: number = 0;

    onLoad () {
        global.messageController.onSyncAllPlayerInfo = this.syncAllPlayerInfo.bind(this);
        var manager = cc.director.getCollisionManager();
        manager.enabled = true;
        manager.enabledDebugDraw = true;
        manager.enabledDrawBoundingBox = true;

        this.netPool = new cc.NodePool();

        FishList.Instance.init(this);
        BulletList.Instance.init(this);
        this.node.on(cc.Node.EventType.TOUCH_START, this.node_TOUCH_START, this)
    
        this.fishRoot = cc.find('Canvas/MainNode')
        let self = this;
        cc.loader.loadRes("fishConfig", function (err, jsonAsset) {
            if (err) {
                console.log(err.message)
                return
            }
            self.fishTypes = <FishType[]>jsonAsset.json;
            self.schedule(self.creatFish, 2)
        })
    }

    start () {
        //请求房间信息并初始化
        global.messageController.sendMessage('request-room-info', "");
    }

    update (_dt) {}


    //屏幕点击事件
    node_TOUCH_START(event: cc.Event.EventTouch){
        console.log("发射炮弹")
        let gun = this.seatList[ this.mySeat].getChildByName("paotai")
        let weaponPos = gun.position;
        let touchPos = gun.parent.convertToNodeSpaceAR(event.getLocation());
        let radian = Math.atan((touchPos.x - weaponPos.x) / (touchPos.y - weaponPos.y));
        let degress = cc.misc.radiansToDegrees(radian);
        gun.getChildByName('weapon').angle = -degress;
        let bullet = cc.instantiate(this.bulletPrefab);
        bullet.getComponent(Bullet).shot(this, 1);
        bullet.parent = this.mainNode;
    }

    //生成鱼
    creatFish(){
        let fishCount = 3;
        for (let i = 0; i < fishCount; i++) {
            let fish = cc.instantiate(this.fishPrefab)
            let x = - Math.random() * 100 - this.node.width / 2
            let y = (Math.random() * -0.5) * 300
            fish.position = cc.v3(x, y)
            fish.parent = this.node
            let type = this.fishTypes[Math.floor(Math.random() * this.fishTypes.length)]
            fish.getComponent(Fish).init(this, type)
        }
    }

    //击中鱼后生成渔网
    createNet(pos: cc.Vec3){
        let net: cc.Node;
        if(this.netPool.size() > 0){
            net = this.netPool.get();
        }
        else{
            net = cc.instantiate(this.netPrefab);
        }
        net.getComponent(Net).init(pos, this);
    }
    depositNet(net: cc.Node){
        this.netPool.put(net);
    }

    userFire(_data: object){
    }


    //获取房间内玩家信息
    syncAllPlayerInfo(data: any){
        //给玩家排座位
        for (let i = 0; i < data.length; i++) {
            this.addPlayer(data[i]);
        }
    }

    //有玩家进入房间
    addPlayer(data: any){
        console.log(data,"有玩家加入房间")
        let seat = data.seat - 1;
        let paoTai = cc.instantiate(this.paoTaiPrefab);
        paoTai.parent = this.seatList[seat];
        console.log(seat,"seat");
        if ((seat + 1) % 2 == 0) {
            paoTai.angle = 180;
            paoTai.y += 15;
        }
        if (data.id === global.playerData.gerUserData().id) {
            paoTai.getChildByName("cannonplus").active = true;
            paoTai.getChildByName("cannomminus").active = true;
            this.mySeat = seat;
        }
    }
}
