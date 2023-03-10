# [x6ud.github.io/figure-doll-editor](https://x6ud.github.io/figure-doll-editor/)

A 3D editor for creating drawing reference models.

Sculpting algorithms are copied from [SculptGL](https://github.com/stephomi/sculptgl).

## [Download models](https://github.com/x6ud/figure-doll-editor/releases/tag/models)

|                                   ![std-male](./images/std-male.jpg)                                   |
|:------------------------------------------------------------------------------------------------------:|
| [std-male](https://github.com/x6ud/figure-doll-editor/releases/download/models/std-male-20230206.doll) |

## Tutorial

Click `File`->`Import...` to import the model.

Rotate the camera with the mouse right button, drag the camera with the mouse middle button.

Rotate the joints with the ![Move Single Joint](./images/ik-rotate-tool.jpg) and ![Move Ik Chain](./images/ik-move-tool.jpg)
tool.

![](./images/rotate-joint.gif)

You can flip the model pose by right-clicking the node -> click `Flip`.

![](./images/flip.jpg)

### Lighting

Click `Add`->`Point Light` to create a light node.

Move the light with the ![Translate](./images/translate-tool.jpg) tool.

Click the ![Shadow On](./images/shading-rendered.jpg) button in the upper right corner to enable lighting.

![](./images/lighting.jpg)

### Create boxes

Select ![Box](./images/box-tool.jpg) tool. Hold `Alt` to create a box.

![](./images/creating-box.gif)

### Import models from .obj files

Click `Add`->`Import .obj`.

Click the `...` button in the properties panel and open your .obj file.

### Import models from [Sketchfab](https://sketchfab.com/)

Save your project first.

Click `Sketchfab`->`Sketchfab Login` and jump to Sketchfab's login page, click `ACCEPT`.

Open [https://sketchfab.com/search?type=models](https://sketchfab.com/search?type=models), check `Downloadable`.

Copy the model page address, go back to the editor and paste it in the `Sketchfab`->`Sketchfab Model URL` input box,
press `Enter` and wait for the model to download.

If the model size is too large it may not be visible in the editor. You can resize the model
with the ![Rescale](./images/rescale-tool.jpg) tool.

### Paint on the model

You can paint on the model with the ![Sculpt Paint](./images/sculpt-paint-tool.jpg) tool.

Note that it only works on `Clay` nodes.

![](./images/painting.gif)

### Adjust the model

You can use the ![Stretch Joint](./images/ik-joint-stretch-tool.jpg) to stretch the model's limbs.

![](./images/stretching-limb.gif)

### Shadow nodes

A clone/mirror of the model can be created by right-clicking the node -> click `Create Shadow Node` or `Create Mirror Shadow Node`.

The names of the shadow nodes are shown in gray. Shadow nodes have the same geometry as the original node, even if the original geometry is modified.

Sculpting tools cannot be used on shadow nodes.

![](./images/shadow.gif)

## Development

### Project setup

```
npm install
```

### Development

```
npm run dev
```

### Compiles and minifies for production

```
npm run build
```
