var exec = require('child_process').exec;
var path = require('path');
var fileUtils = require('./util');

function vHost () {

  var sitesEnable='/etc/apache2/sites-enabled/';
  var sitesAvailable='/etc/apache2/sites-available/';


  /**
   * Create Virtual Host
   * @param  string domain
   * @param  string dir
   * @param  string template
   * @return mixed
   */
  this.create = function(domain, dir, template) {

    var sitesAvailableDomain = sitesAvailable + domain + '.conf';

    if( fileUtils.fileExists(sitesAvailableDomain) ) {
      console.error('This domain already exists.\nPlease Try Another one');
      return;
    }

    if( !template ) {
       template = this.getDefaultTemplate();
    }


    var dir = !dir ? path.resolve(".") : path.normalize(dir);

    // valid dir exists
    // 

    template = template
                .replace(/{{domain}}/g, domain )
                .replace(/{{dir}}/g, dir);

    try {

      /**
       * Write Virtualhost Config
       */
      if( !fileUtils.writeFile(sitesAvailableDomain, template) ) {
        console.error('Not write file in ' + sitesAvailableDomain);
        return;
      }


      /**
       * Update Host file
       */
      if( !fileUtils.writeStream('/etc/hosts', "\n127.0.0.1  "+ domain , {'flags': 'a' }) ) {
        console.error('Not write file Hosts ');
        return;
      }

      /**
       * Enable site and Reload apache
       */

      // enable website
      exec('cd ' + sitesEnable + ' && ln -s ' + sitesAvailableDomain, function(err){
        if(err){
          console.error(err);
          return;
        }
      });

      // restart Apache
      exec('/etc/init.d/apache2 reload', function (error, stdout, stderr) {
        if( stderr ){
          console.error(err);
          return;
        }

        console.log('Complete! \nYou now have a new Virtual Host \n Your new host is: [ http://'+ domain +' ]\n And its located at ' +dir)
      });


    } catch(e) {
      console.log('errr');
      console.error(e);
    }

  };

  /**
   * @todo : Delete virtualhost
   * @param
   * @return
   */
  this.delete = function(domain){


  };

  /**
   * Get default template
   * @return string
   */
  this.getDefaultTemplate = function(){
    return  "#Generated by mvhost\n"+
            "<VirtualHost *:80>\n"+
            "  ServerAdmin localhost@{{domain}}\n"+
            "  ServerName {{domain}}\n"+
            "  DocumentRoot {{dir}}\n"+
            "  <Directory {{dir}}/>\n"+
            "      SetEnv APPLICATION_ENV development\n"+
            "      Options Indexes FollowSymLinks MultiViews\n"+
            "      AllowOverride all\n"+
            "      Order allow,deny\n"+
            "      allow from all\n"+
            "      Require all granted\n"+
            "  </Directory>\n"+
            "  ErrorLog ${APACHE_LOG_DIR}/{{domain}}-error.log\n"+
            "  CustomLog ${APACHE_LOG_DIR}/{{domain}}-access.log combined\n"+
            "</VirtualHost>\n";
              };



}

module.exports = vHost;
