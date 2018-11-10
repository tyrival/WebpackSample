1、先配置webpack开发环境，由于使用arcgis api原因，nodejs版本必须大于8.x.x;
2、代码下载完以后先npm install下载依赖库;
3、node_modules和package-lock.json请不要上传svn；node_modules很大，文件很碎;如果npm版本和package-lock.json中npm版本不一样，npm install的时候会报错"npm err write after end"
4、调试代码请执行npm start;打包发布请执行npm run build